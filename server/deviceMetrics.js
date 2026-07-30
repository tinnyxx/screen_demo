import crypto from 'crypto'
import { sql } from './start.js'
import {
  getAllDeviceStatuses,
  queryDeviceEventLogs,
  queryDeviceProperties,
} from './onenet.js'
import { getShanghaiDates } from './dashboard.js'

/** 滤芯寿命：1500 次打卡后为 0% */
const FILTER_LIFE_MAX_CHECKINS = 1500
/** 每次打卡处理尿液 0.08L */
const URINE_PER_CHECKIN_L = 0.08
/** 粪便盒超声距离：空 46cm，满 27cm */
const FECES_EMPTY_CM = 46
const FECES_FULL_CM = 27
/** 滤芯寿命低于该百分比时产生运维报警 */
const FILTER_ALARM_PERCENT = 20
const FECES_ALARM_PERCENT = 80

const PROPERTY_IDENTIFIERS = ['wet', 'distance', 'waterout']
const CACHE_TTL_MS = 30 * 1000
/** waterout 快照写入节流：每设备至少间隔 10 分钟 */
const SNAPSHOT_MIN_INTERVAL_MS = 10 * 60 * 1000
/** 每轮拉取近 7 天 warn；入库后永久保留待处理，source_event_key 防重复 */
const WARN_LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000

async function getCommunityDevices(communityId) {
  return communityId
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

function computeFecesBoxPercent(distanceCm) {
  if (distanceCm === null) return null
  const ratio = (FECES_EMPTY_CM - distanceCm) / (FECES_EMPTY_CM - FECES_FULL_CM)
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

function warnMessage(event) {
  const value = event.value
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (value !== null && value !== undefined) return `OneNET告警：${JSON.stringify(value)}`
  return event.name ? `OneNET告警：${event.name}` : 'OneNET设备告警'
}

async function persistWarnEvents(deviceId, events) {
  for (const event of events) {
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
          ${warnMessage(event)},
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

  // 仅对在线且绑定了 OneNET 名的桩下发属性查询
  const propertyResults = await Promise.all(
    deviceRows.map(async (row) => {
      const onenetName = String(row.onenet_device_name ?? '').trim()
      const onenetDevice = onenetName ? onenetByName.get(onenetName) : null
      if (!onenetDevice || onenetDevice.status !== 1) return null
      try {
        return await queryDeviceProperties(onenetName, PROPERTY_IDENTIFIERS)
      } catch (error) {
        console.warn(`OneNET 属性查询失败 (${onenetName}):`, error.message)
        return null
      }
    }),
  )

  const warnResults = await Promise.all(
    deviceRows.map(async (row) => {
      const onenetName = String(row.onenet_device_name ?? '').trim()
      if (!onenetName) return []
      try {
        return await queryDeviceEventLogs(onenetName, {
          identifier: 'warn',
          startTime: Date.now() - WARN_LOOKBACK_MS,
          endTime: Date.now(),
          limit: 100,
        })
      } catch (error) {
        console.warn(`OneNET warn 查询失败 (${onenetName}):`, error.message)
        return []
      }
    }),
  )

  const maintenanceTasks = []

  const devices = await Promise.all(
    deviceRows.map(async (row, index) => {
      const id = String(row.id)
      const onenetName = String(row.onenet_device_name ?? '').trim() || null
      const onenetDevice = onenetName ? onenetByName.get(onenetName) : null
      const online = onenetDevice ? onenetDevice.status === 1 : false
      const counts = checkinCounts.get(id) ?? {
        total: 0,
        today: 0,
        filterCheckins: 0,
      }
      const props = propertyResults[index]

      const soilMoisture = toFiniteNumber(props?.wet)
      const distanceCm = toFiniteNumber(props?.distance)
      const waterout = toFiniteNumber(props?.waterout)
      const filterLife = computeFilterLife(counts.filterCheckins)
      const fecesBoxPercent = computeFecesBoxPercent(distanceCm)

      if (waterout !== null) {
        await recordWateroutSnapshot(id, waterout)
      }

      await persistWarnEvents(id, warnResults[index])

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
        deviceNo: index + 1,
        name: row.name || id,
        onenetName,
        online,
        todayUsage: counts.today,
        totalCheckins: counts.total,
        soilMoisture: soilMoisture === null ? null : Math.round(soilMoisture * 10) / 10,
        filterLife,
        distanceCm,
        fecesBoxPercent,
        waterout,
      }
    }),
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

  const totalCheckins = devices.reduce((sum, device) => sum + device.totalCheckins, 0)
  const waterSaving = devices.reduce((sum, device) => sum + (device.waterout ?? 0), 0)

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
