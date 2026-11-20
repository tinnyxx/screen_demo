import crypto from 'crypto'
import { sql } from './start.js'
import {
  getAllDeviceStatuses,
  queryAllDeviceEventLogs,
  queryDeviceProperties,
} from './onenet.js'
import { filterDisplayedDeviceIds, getShanghaiDates } from './dashboard.js'

/** 滤芯寿命：1500 次打卡后为 0% */
const FILTER_LIFE_MAX_CHECKINS = 1500
/** 每次打卡处理尿液 0.08L */
const URINE_PER_CHECKIN_L = 0.08
/** 粪便盒超声距离（mm）：空 ≥360，满 ≤290 */
const FECES_EMPTY_MM = 360
const FECES_FULL_MM = 290
/** 滤芯寿命低于该百分比时产生运维报警 */
const FILTER_ALARM_PERCENT = 20
const FECES_ALARM_PERCENT = 80

/**
 * OneNET 双板映射：top 板读 distance/temp/wet，esp 板读 waterout。
 * 同一逻辑设备任一块离线则整体离线；事件从所有关联板名合并拉取。
 * 蓝湾沿用 101/ESP。圣拿威、华润用 pet_devices.onenet_device_name
 * （圣拿威 01 号 STATION_004 / SZGXY202，华润 01 号 STATION_006 / SZCR101）。
 */
const ONENET_BOARD_MAP = {
  STATION_001: { top: 'SZGXY101', esp: 'SZGXY101ESP' },
  STATION_002: { top: 'ESP32C3A1', esp: null },
}

/** 大屏展示顺序：01号=STATION_001，02号=STATION_002 */
const DEVICE_SLOT_ORDER = ['STATION_001', 'STATION_002']

/** 蓝湾大屏槽位 → 打卡统计来源（pet_devices.id）；圣拿威不互换 */
const CHECKIN_SOURCE_BY_SLOT = {
  STATION_001: 'STATION_002',
  STATION_002: 'STATION_001',
}

function resolveCheckinSourceId(displayDeviceId, communityId) {
  if (communityId !== 'lanwan') return displayDeviceId
  return CHECKIN_SOURCE_BY_SLOT[displayDeviceId] ?? displayDeviceId
}

function resolveDeviceNo(deviceId, fallbackIndex, communityId) {
  if (communityId !== 'lanwan') return fallbackIndex + 1
  const slotIndex = DEVICE_SLOT_ORDER.indexOf(deviceId)
  return slotIndex >= 0 ? slotIndex + 1 : fallbackIndex + 1
}

function resolveDeviceLabel(deviceId, fallbackName, fallbackIndex, communityId) {
  const deviceNo = resolveDeviceNo(deviceId, fallbackIndex, communityId)
  return deviceNo > 0 ? `${String(deviceNo).padStart(2, '0')}号` : fallbackName
}

function sortDevicesBySlot(devices) {
  return [...devices].sort((a, b) => {
    const ai = DEVICE_SLOT_ORDER.indexOf(a.id)
    const bi = DEVICE_SLOT_ORDER.indexOf(b.id)
    if (ai === -1 && bi === -1) return 0
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })
}

const TOP_PROPERTY_IDENTIFIERS = ['distance', 'temp', 'wet']
const ESP_PROPERTY_IDENTIFIERS = ['waterout', 'waterin']

const CACHE_TTL_MS = 30 * 1000
/** waterout 快照写入节流：每设备至少间隔 10 分钟 */
const SNAPSHOT_MIN_INTERVAL_MS = 10 * 60 * 1000

async function getCommunityDevices(communityId) {
  const rows = communityId
    ? await sql`
        SELECT d.id, d.name, d.onenet_device_name, d.filter_replaced_at
        FROM pet_devices d
        WHERE d.community_id::text IN (
          SELECT c.id::text FROM communities c WHERE c.code = ${communityId}
        )
          AND COALESCE(d.is_active, TRUE) = TRUE
        ORDER BY d.id
      `
    : await sql`
        SELECT d.id, d.name, d.onenet_device_name, d.filter_replaced_at
        FROM pet_devices d
        WHERE COALESCE(d.is_active, TRUE) = TRUE
        ORDER BY d.id
      `

  const visibleIds = new Set(
    filterDisplayedDeviceIds(
      communityId,
      rows.map((row) => String(row.id)),
    ),
  )
  return rows.filter((row) => visibleIds.has(String(row.id)))
}

async function getPerDeviceCheckinCounts(deviceIds, todayText) {
  if (deviceIds.length === 0) return new Map()

  const rows = await sql`
    SELECT cr.device_id,
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE cr.checkin_date = ${todayText}::date)::int AS today,
           COUNT(*) FILTER (
             WHERE d.filter_replaced_at IS NULL
                OR cr.checkin_time >= d.filter_replaced_at
           )::int AS filter_checkins
    FROM checkin_records cr
    INNER JOIN pet_devices d ON d.id = cr.device_id
    WHERE COALESCE(cr.status, 'success') = 'success'
      AND cr.device_id IN ${sql(deviceIds)}
    GROUP BY cr.device_id
  `

  return new Map(
    rows.map((row) => [
      String(row.device_id),
      {
        total: Number(row.total) || 0,
        today: Number(row.today) || 0,
        filterCheckins: Number(row.filter_checkins) || 0,
      },
    ]),
  )
}

function toFiniteNumber(raw) {
  if (raw === null || raw === undefined || raw === '') return null
  const value = Number(raw)
  return Number.isFinite(value) ? value : null
}

function computeFilterLife(totalCheckins) {
  const remaining = 1 - totalCheckins / FILTER_LIFE_MAX_CHECKINS
  return Math.max(0, Math.round(remaining * 100))
}

function computeFecesBoxPercent(distanceMm) {
  if (distanceMm === null) return null
  const ratio = (FECES_EMPTY_MM - distanceMm) / (FECES_EMPTY_MM - FECES_FULL_MM)
  return Math.max(0, Math.min(100, Math.round(ratio * 100)))
}

function shanghaiNowLabel() {
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date())
  const get = (type) => parts.find((part) => part.type === type)?.value ?? '00'
  return `${get('month')}/${get('day')} ${get('hour')}:${get('minute')}`
}

function resolveBoardConfig(deviceId, onenetDeviceName, communityId) {
  if (communityId !== 'lanwan') {
    const top = String(onenetDeviceName ?? '').trim()
    return {
      top: top || null,
      esp: null,
      eventSources: top ? [top] : [],
    }
  }

  const mapped = ONENET_BOARD_MAP[deviceId]
  if (mapped) {
    const eventSources = [mapped.top, mapped.esp].filter(Boolean)
    return { top: mapped.top, esp: mapped.esp, eventSources }
  }

  const fallback = String(onenetDeviceName ?? '').trim()
  return {
    top: fallback || null,
    esp: null,
    eventSources: fallback ? [fallback] : [],
  }
}

function isLogicalDeviceOnline(boards, onenetByName) {
  const names = [boards.top, boards.esp].filter(Boolean)
  if (names.length === 0) return false
  return names.every((name) => onenetByName.get(name)?.status === 1)
}

async function fetchBoardProperties(boards, onenetByName) {
  const result = {}

  const topName = boards.top
  const topOnline = topName && onenetByName.get(topName)?.status === 1
  if (topOnline) {
    try {
      Object.assign(result, await queryDeviceProperties(topName, TOP_PROPERTY_IDENTIFIERS))
    } catch (error) {
      console.warn(`OneNET 属性查询失败 (${topName}):`, error.message)
    }
  }

  const espName = boards.esp
  const espOnline = espName && onenetByName.get(espName)?.status === 1
  if (espOnline) {
    try {
      Object.assign(result, await queryDeviceProperties(espName, ESP_PROPERTY_IDENTIFIERS))
    } catch (error) {
      console.warn(`OneNET 属性查询失败 (${espName}):`, error.message)
    }
  } else if (topOnline && !espName) {
    try {
      Object.assign(result, await queryDeviceProperties(topName, ESP_PROPERTY_IDENTIFIERS))
    } catch (error) {
      console.warn(`OneNET 属性查询失败 (${topName}):`, error.message)
    }
  }

  return result
}

async function fetchAllWarnEvents(eventSources) {
  const allEvents = []

  for (const deviceName of eventSources) {
    try {
      const events = await queryAllDeviceEventLogs(deviceName, { identifier: 'warn' })
      allEvents.push(...events)
    } catch (error) {
      console.warn(`OneNET warn 查询失败 (${deviceName}):`, error.message)
    }
  }

  allEvents.sort((a, b) => Number(b.time ?? 0) - Number(a.time ?? 0))
  return filterValidWarnEvents(allEvents)
}

// ---------- waterout 快照 ----------

const lastSnapshotAt = new Map()

async function recordWateroutSnapshot(deviceId, waterout) {
  const last = lastSnapshotAt.get(deviceId) ?? 0
  if (Date.now() - last < SNAPSHOT_MIN_INTERVAL_MS) return

  try {
    await sql`
      INSERT INTO device_waterout_readings (device_id, waterout)
      VALUES (${deviceId}, ${waterout})
    `
    lastSnapshotAt.set(deviceId, Date.now())
  } catch (error) {
    console.warn(`waterout 快照写入失败 (${deviceId}):`, error.message)
  }
}

/** 每设备最近一条快照，设备离线读不到实时 waterout 时兜底 */
async function getLatestWateroutByDevice(deviceIds) {
  if (deviceIds.length === 0) return new Map()
  try {
    const rows = await sql`
      SELECT DISTINCT ON (device_id) device_id, waterout
      FROM device_waterout_readings
      WHERE device_id IN ${sql(deviceIds)}
      ORDER BY device_id, recorded_at DESC
    `
    return new Map(rows.map((row) => [String(row.device_id), Number(row.waterout) || 0]))
  } catch (error) {
    console.warn('waterout 最新快照查询失败:', error.message)
    return new Map()
  }
}

// ---------- 设备报警（device_alerts） ----------

async function upsertDetectionAlert(deviceId, alertType, message) {
  try {
    await sql`
      INSERT INTO device_alerts (device_id, alert_type, source, message)
      VALUES (${deviceId}, ${alertType}, 'detection', ${message})
      ON CONFLICT (device_id, alert_type)
        WHERE resolved_at IS NULL AND source = 'detection'
      DO UPDATE SET message = EXCLUDED.message
    `
  } catch (error) {
    console.warn(`报警写入失败 (${deviceId}):`, error.message)
  }
}

async function resolveDetectionAlert(deviceId, alertType) {
  try {
    await sql`
      UPDATE device_alerts
      SET resolved_at = CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Shanghai'
      WHERE device_id = ${deviceId}
        AND alert_type = ${alertType}
        AND source = 'detection'
        AND resolved_at IS NULL
    `
  } catch (error) {
    console.warn(`报警解除失败 (${deviceId}):`, error.message)
  }
}

function warnEventKey(deviceId, event) {
  const payload = `${deviceId}|${event.time ?? ''}|${event.identifier ?? 'warn'}|${JSON.stringify(event.value ?? '')}`
  return crypto.createHash('sha256').update(payload).digest('hex')
}

function parseWarnValue(raw) {
  if (raw === null || raw === undefined) return null
  if (typeof raw === 'object') return raw
  if (typeof raw !== 'string') return null

  const text = raw.trim()
  if (!text) return null

  try {
    const parsed = JSON.parse(text)
    if (typeof parsed === 'string') {
      try {
        return JSON.parse(parsed)
      } catch {
        return null
      }
    }
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

/** 仅取 identifier=warn 且 value.warn 非空；完全忽略 info */
function extractWarnText(event) {
  if (String(event?.identifier ?? 'warn') !== 'warn') return null

  const parsed = parseWarnValue(event.value)
  if (!parsed || typeof parsed !== 'object') return null

  const text = String(parsed.warn ?? '').trim()
  return text || null
}

function filterValidWarnEvents(events) {
  if (!Array.isArray(events)) return []
  return events.filter((event) => extractWarnText(event) !== null)
}

async function persistWarnEvents(deviceId, events) {
  for (const event of events) {
    const message = extractWarnText(event)
    if (!message) continue

    const key = warnEventKey(deviceId, event)
    const rawTime = Number(event.time)
    const eventTime = Number.isFinite(rawTime)
      ? new Date(rawTime < 1e12 ? rawTime * 1000 : rawTime).toISOString()
      : new Date().toISOString()

    try {
      await sql`
        INSERT INTO device_alerts (
          device_id, alert_type, source, source_event_key, message, created_at
        )
        VALUES (
          ${deviceId},
          'onenet_warn',
          'onenet_warn',
          ${key},
          ${message},
          ${eventTime}::timestamptz AT TIME ZONE 'Asia/Shanghai'
        )
        ON CONFLICT (source_event_key)
          WHERE source_event_key IS NOT NULL
        DO NOTHING
      `
    } catch (error) {
      console.warn(`OneNET warn 入库失败 (${deviceId}):`, error.message)
    }
  }
}

/** 先过滤 OneNET 事件，再清空待处理 onenet_warn，最后仅写入 warn 非空的记录 */
async function syncOnenetWarnAlerts(deviceId, rawEvents) {
  const validEvents = filterValidWarnEvents(rawEvents)

  try {
    await sql`
      DELETE FROM device_alerts
      WHERE device_id = ${deviceId}
        AND source = 'onenet_warn'
        AND resolved_at IS NULL
    `
  } catch (error) {
    console.warn(`onenet_warn 待处理清理失败 (${deviceId}):`, error.message)
  }

  await persistWarnEvents(deviceId, validEvents)
}

async function getVisibleAlerts(deviceIds) {
  if (deviceIds.length === 0) return []
  return sql`
    SELECT
      id,
      device_id,
      alert_type,
      source,
      message,
      to_char(created_at, 'MM/DD HH24:MI') AS datetime_label,
      CASE WHEN resolved_at IS NULL THEN 'pending' ELSE 'done' END AS status
    FROM device_alerts
    WHERE device_id IN ${sql(deviceIds)}
      AND (
        resolved_at IS NULL
        OR resolved_at >= date_trunc(
          'day',
          CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Shanghai'
        )
      )
      AND (source <> 'onenet_warn' OR (
        NULLIF(TRIM(message), '') IS NOT NULL
        AND LEFT(TRIM(message), 1) <> '{'
        AND message NOT LIKE 'OneNET告警：%'
        AND message NOT LIKE 'OneNET设备告警%'
      ))
    ORDER BY (resolved_at IS NULL) DESC, created_at DESC
  `
}

// ---------- 主流程 ----------

async function buildCommunityDeviceMetrics(communityId) {
  const [{ today }, deviceRows] = await Promise.all([
    getShanghaiDates(),
    getCommunityDevices(communityId),
  ])

  const deviceIds = deviceRows.map((row) => String(row.id))
  const [checkinCounts, onenetStatus] = await Promise.all([
    getPerDeviceCheckinCounts(deviceIds, today),
    getAllDeviceStatuses().catch((error) => {
      console.warn('OneNET 设备状态查询失败，指标降级:', error.message)
      return null
    }),
  ])

  const onenetByName = new Map(
    (onenetStatus?.devices ?? []).map((device) => [device.name, device]),
  )

  const boardConfigs = deviceRows.map((row) =>
    resolveBoardConfig(String(row.id), row.onenet_device_name, communityId),
  )

  const propertyResults = await Promise.all(
    boardConfigs.map((boards) => fetchBoardProperties(boards, onenetByName)),
  )

  const warnResults = await Promise.all(
    boardConfigs.map((boards) => fetchAllWarnEvents(boards.eventSources)),
  )

  const maintenanceTasks = []

  const devices = sortDevicesBySlot(
    await Promise.all(
    deviceRows.map(async (row, index) => {
      const id = String(row.id)
      const boards = boardConfigs[index]
      const primaryOnenetName = boards.top || boards.esp || null
      const online = isLogicalDeviceOnline(boards, onenetByName)
      const checkinSourceId = resolveCheckinSourceId(id, communityId)
      const counts = checkinCounts.get(checkinSourceId) ?? {
        total: 0,
        today: 0,
        filterCheckins: 0,
      }
      const props = propertyResults[index]

      const distanceMm = toFiniteNumber(props?.distance)
      const soilMoisture = toFiniteNumber(props?.wet)
      const waterout = toFiniteNumber(props?.waterout)
      const filterLife = computeFilterLife(counts.filterCheckins)
      const fecesBoxPercent = computeFecesBoxPercent(distanceMm)

      if (waterout !== null) {
        await recordWateroutSnapshot(id, waterout)
      }

      await syncOnenetWarnAlerts(id, warnResults[index])

      if (filterLife < FILTER_ALARM_PERCENT) {
        await upsertDetectionAlert(
          id,
          'filter_life',
          `滤芯寿命仅剩${filterLife}%，请及时更换`,
        )
      } else if (filterLife > FILTER_ALARM_PERCENT) {
        await resolveDetectionAlert(id, 'filter_life')
      }

      if (fecesBoxPercent !== null && fecesBoxPercent > FECES_ALARM_PERCENT) {
        await upsertDetectionAlert(
          id,
          'feces_box',
          `粪便盒已达${fecesBoxPercent}%，请及时清理`,
        )
      } else if (fecesBoxPercent !== null && fecesBoxPercent < FECES_ALARM_PERCENT) {
        await resolveDetectionAlert(id, 'feces_box')
      }

      return {
        id,
        deviceNo: resolveDeviceNo(id, index, communityId),
        name: resolveDeviceLabel(id, row.name || id, index, communityId),
        onenetName: primaryOnenetName,
        online,
        todayUsage: counts.today,
        totalCheckins: counts.total,
        soilMoisture,
        filterLife,
        distanceMm,
        fecesBoxPercent,
        waterout,
      }
    }),
    ),
  )

  const deviceNoById = new Map(devices.map((device) => [device.id, device.deviceNo]))
  const deviceNameById = new Map(devices.map((device) => [device.id, device.name]))

  const visibleAlerts = await getVisibleAlerts(deviceIds)
  for (const alert of visibleAlerts) {
    const deviceId = String(alert.device_id)
    maintenanceTasks.push({
      id: String(alert.id),
      deviceNo: deviceNoById.get(deviceId) ?? 0,
      deviceName: deviceNameById.get(deviceId) ?? deviceId,
      event: alert.message,
      datetime: alert.datetime_label,
      status: alert.status,
      source: alert.source,
    })
  }

  const totalCheckins = deviceIds.reduce(
    (sum, deviceId) => sum + (checkinCounts.get(deviceId)?.total ?? 0),
    0,
  )

  // 累计节水：实时值读不到（离线）时用最近一条快照，避免离线导致累计数掉零
  const latestWaterout = await getLatestWateroutByDevice(deviceIds)
  const waterSaving = devices.reduce(
    (sum, device) => sum + (device.waterout ?? latestWaterout.get(device.id) ?? 0),
    0,
  )

  return {
    communityId,
    updatedAt: shanghaiNowLabel(),
    devices,
    summary: {
      total: devices.length,
      online: devices.filter((device) => device.online).length,
      offline: devices.filter((device) => !device.online).length,
    },
    totals: {
      totalCheckins,
      urineLiters: Number((totalCheckins * URINE_PER_CHECKIN_L).toFixed(2)),
      waterSavingLiters: Number(waterSaving.toFixed(2)),
    },
    alarms: maintenanceTasks,
  }
}

const metricsCache = new Map()

/** 带 30s 缓存：避免多面板轮询重复向 OneNET 下发属性查询 */
export async function getCommunityDeviceMetrics(communityId = null) {
  const key = communityId ?? '__all__'
  const cached = metricsCache.get(key)

  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.promise
  }

  const promise = buildCommunityDeviceMetrics(communityId)
  metricsCache.set(key, { at: Date.now(), promise })

  try {
    return await promise
  } catch (error) {
    metricsCache.delete(key)
    throw error
  }
}
