import { sql } from './start.js'

export const VALID_COMMUNITY_IDS = new Set(['lanwan', 'huarun', 'shengnawei'])

/** 大屏只展示这些设备；未列出的小区展示全部启用设备 */
const DISPLAY_DEVICE_IDS = {
  huarun: ['STATION_006'],
}

export function filterDisplayedDeviceIds(communityId, deviceIds) {
  const allow = DISPLAY_DEVICE_IDS[communityId]
  if (!allow) return deviceIds
  const allowSet = new Set(allow)
  return deviceIds.filter((id) => allowSet.has(String(id)))
}

export function normalizeCommunityId(raw) {
  const value = String(raw ?? '').trim()
  return VALID_COMMUNITY_IDS.has(value) ? value : null
}

/**
 * 解析小区 code → 设备 id 列表
 * communities.code → pet_devices.community_id → pet_devices.id
 * 用 ::text 比较，避免 integer / varchar 类型不一致导致 500
 */
async function getCommunityDeviceIds(communityId) {
  if (!communityId) return null

  const rows = await sql`
    SELECT d.id
    FROM pet_devices d
    WHERE d.community_id::text IN (
      SELECT c.id::text
      FROM communities c
      WHERE c.code = ${communityId}
    )
      AND COALESCE(d.is_active, TRUE) = TRUE
  `

  return filterDisplayedDeviceIds(
    communityId,
    rows.map((row) => String(row.id)),
  )
}

function fillHourlyCounts(rows) {
  const byHour = new Map(rows.map((row) => [Number(row.hour), Number(row.count) || 0]))
  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: byHour.get(hour) ?? 0,
  }))
}

async function queryHourlyForDate(dateText, deviceIds) {
  if (deviceIds !== null && deviceIds.length === 0) {
    return fillHourlyCounts([])
  }

  const rows =
    deviceIds === null
      ? await sql`
          SELECT EXTRACT(HOUR FROM checkin_time)::int AS hour,
                 COUNT(*)::int AS count
          FROM checkin_records
          WHERE checkin_date = ${dateText}::date
            AND COALESCE(status, 'success') = 'success'
          GROUP BY 1
        `
      : await sql`
          SELECT EXTRACT(HOUR FROM checkin_time)::int AS hour,
                 COUNT(*)::int AS count
          FROM checkin_records
          WHERE checkin_date = ${dateText}::date
            AND COALESCE(status, 'success') = 'success'
            AND device_id IN ${sql(deviceIds)}
          GROUP BY 1
        `

  return fillHourlyCounts(rows)
}

export async function getShanghaiDates() {
  const [row] = await sql`
    SELECT
      (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Shanghai')::date::text AS today,
      ((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Shanghai')::date - 1)::text AS yesterday,
      to_char(
        date_trunc('month', (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Shanghai')::date) - INTERVAL '1 month',
        'YYYY-MM'
      ) AS last_month
  `
  return row
}

async function countSuccessOnDate(dateText, deviceIds) {
  if (deviceIds !== null && deviceIds.length === 0) return 0

  const [row] =
    deviceIds === null
      ? await sql`
          SELECT COUNT(*)::int AS total
          FROM checkin_records
          WHERE checkin_date = ${dateText}::date
            AND COALESCE(status, 'success') = 'success'
        `
      : await sql`
          SELECT COUNT(*)::int AS total
          FROM checkin_records
          WHERE checkin_date = ${dateText}::date
            AND COALESCE(status, 'success') = 'success'
            AND device_id IN ${sql(deviceIds)}
        `

  return Number(row?.total) || 0
}

async function countSuccessInMonth(monthKey, deviceIds) {
  const startDate = `${monthKey}-01`

  if (deviceIds !== null && deviceIds.length === 0) return 0

  const [row] =
    deviceIds === null
      ? await sql`
          SELECT COUNT(*)::int AS total
          FROM checkin_records
          WHERE checkin_date >= ${startDate}::date
            AND checkin_date < (${startDate}::date + INTERVAL '1 month')
            AND COALESCE(status, 'success') = 'success'
        `
      : await sql`
          SELECT COUNT(*)::int AS total
          FROM checkin_records
          WHERE checkin_date >= ${startDate}::date
            AND checkin_date < (${startDate}::date + INTERVAL '1 month')
            AND COALESCE(status, 'success') = 'success'
            AND device_id IN ${sql(deviceIds)}
        `

  return Number(row?.total) || 0
}

async function countAllSuccess(deviceIds) {
  if (deviceIds !== null && deviceIds.length === 0) return 0

  const [row] =
    deviceIds === null
      ? await sql`
          SELECT COUNT(*)::int AS total
          FROM checkin_records
          WHERE COALESCE(status, 'success') = 'success'
        `
      : await sql`
          SELECT COUNT(*)::int AS total
          FROM checkin_records
          WHERE COALESCE(status, 'success') = 'success'
            AND device_id IN ${sql(deviceIds)}
        `

  return Number(row?.total) || 0
}

export async function getHourlyStats(communityId = null) {
  const { today, yesterday } = await getShanghaiDates()
  const deviceIds = await getCommunityDeviceIds(communityId)
  const [todayHourly, yesterdayHourly] = await Promise.all([
    queryHourlyForDate(today, deviceIds),
    queryHourlyForDate(yesterday, deviceIds),
  ])
  return { today, yesterday, todayHourly, yesterdayHourly }
}

export async function getTodayTotal(communityId = null) {
  const { today } = await getShanghaiDates()
  const deviceIds = await getCommunityDeviceIds(communityId)
  const total = await countSuccessOnDate(today, deviceIds)
  return { date: today, total }
}

export async function getYesterdayTotal(communityId = null) {
  const { yesterday } = await getShanghaiDates()
  const deviceIds = await getCommunityDeviceIds(communityId)
  return countSuccessOnDate(yesterday, deviceIds)
}

/** month: 'YYYY-MM'；缺省为上海时区上月 */
export async function getMonthlyTotal(month, communityId = null) {
  let monthKey = String(month ?? '').trim()

  if (!/^\d{4}-\d{2}$/.test(monthKey)) {
    const dates = await getShanghaiDates()
    monthKey = dates.last_month
  }

  const deviceIds = await getCommunityDeviceIds(communityId)
  const total = await countSuccessInMonth(monthKey, deviceIds)
  return { month: monthKey, total }
}

/** 每次打卡处理尿液 0.08L */
const URINE_PER_CHECKIN_L = 0.08

/**
 * 区间节水（L）：waterout 是设备累计值，取每台设备
 * 区间结束前最后一条快照 − 区间开始前最后一条快照（无则用区间内第一条）求差后求和。
 * endText 传 null 表示到当前时刻。
 */
async function sumWateroutDelta(deviceIds, startText, endText) {
  if (deviceIds !== null && deviceIds.length === 0) return 0

  const deviceFilter = deviceIds === null ? sql`TRUE` : sql`device_id IN ${sql(deviceIds)}`
  const endBoundary = endText === null ? sql`CURRENT_TIMESTAMP` : sql`${endText}::timestamp`

  try {
    const [row] = await sql`
      WITH ends AS (
        SELECT DISTINCT ON (device_id) device_id, waterout
        FROM device_waterout_readings
        WHERE ${deviceFilter} AND recorded_at < ${endBoundary}
        ORDER BY device_id, recorded_at DESC
      ),
      starts AS (
        SELECT DISTINCT ON (device_id) device_id, waterout
        FROM device_waterout_readings
        WHERE ${deviceFilter} AND recorded_at < ${startText}::timestamp
        ORDER BY device_id, recorded_at DESC
      ),
      first_in AS (
        SELECT DISTINCT ON (device_id) device_id, waterout
        FROM device_waterout_readings
        WHERE ${deviceFilter}
          AND recorded_at >= ${startText}::timestamp
          AND recorded_at < ${endBoundary}
        ORDER BY device_id, recorded_at ASC
      )
      SELECT COALESCE(
        SUM(GREATEST(e.waterout - COALESCE(s.waterout, f.waterout, e.waterout), 0)),
        0
      )::float AS total
      FROM ends e
      LEFT JOIN starts s USING (device_id)
      LEFT JOIN first_in f USING (device_id)
    `
    return Number(row?.total) || 0
  } catch (error) {
    // device_waterout_readings 未建表时降级为 0
    console.warn('waterout 区间统计失败:', error.message)
    return 0
  }
}

function compareStats(todayValue, yesterdayValue) {
  if (yesterdayValue > 0) {
    const percent = Number(
      (((todayValue - yesterdayValue) / yesterdayValue) * 100).toFixed(1),
    )
    return {
      comparePercent: Math.abs(percent),
      trend: todayValue >= yesterdayValue ? 'up' : 'down',
    }
  }
  if (todayValue > 0) {
    return { comparePercent: 100, trend: 'up' }
  }
  return { comparePercent: 0, trend: 'up' }
}

function roundLiters(value) {
  return Number(value.toFixed(2))
}

/** 大屏一轮询：小时曲线 + 今日总计 + 上月累计 */
export async function getCheckinDashboardStats(communityId = null) {
  const dates = await getShanghaiDates()
  const deviceIds = await getCommunityDeviceIds(communityId)

  const thisMonthStart = `${dates.today.slice(0, 7)}-01`
  const lastMonthStart = `${dates.last_month}-01`

  const [
    todayHourly,
    yesterdayHourly,
    todayTotal,
    yesterdayTotal,
    lastMonthTotal,
    totalCheckins,
    todayWaterSaving,
    yesterdayWaterSaving,
    lastMonthWaterSaving,
  ] = await Promise.all([
    queryHourlyForDate(dates.today, deviceIds),
    queryHourlyForDate(dates.yesterday, deviceIds),
    countSuccessOnDate(dates.today, deviceIds),
    countSuccessOnDate(dates.yesterday, deviceIds),
    countSuccessInMonth(dates.last_month, deviceIds),
    countAllSuccess(deviceIds),
    sumWateroutDelta(deviceIds, dates.today, null),
    sumWateroutDelta(deviceIds, dates.yesterday, dates.today),
    sumWateroutDelta(deviceIds, lastMonthStart, thisMonthStart),
  ])

  const checkinCompare = compareStats(todayTotal, yesterdayTotal)
  const waterSavingCompare = compareStats(todayWaterSaving, yesterdayWaterSaving)

  return {
    communityId,
    today: dates.today,
    yesterday: dates.yesterday,
    todayHourly,
    yesterdayHourly,
    todayTotal,
    yesterdayTotal,
    comparePercent: checkinCompare.comparePercent,
    trend: checkinCompare.trend,
    lastMonth: dates.last_month,
    lastMonthTotal,
    totalCheckins,
    // 尿液按打卡次数 × 0.08L 推算，对比与打卡同步
    todayUrineLiters: roundLiters(todayTotal * URINE_PER_CHECKIN_L),
    yesterdayUrineLiters: roundLiters(yesterdayTotal * URINE_PER_CHECKIN_L),
    lastMonthUrineLiters: roundLiters(lastMonthTotal * URINE_PER_CHECKIN_L),
    urineComparePercent: checkinCompare.comparePercent,
    urineTrend: checkinCompare.trend,
    // 节水按 waterout 快照区间差值
    todayWaterSavingLiters: roundLiters(todayWaterSaving),
    yesterdayWaterSavingLiters: roundLiters(yesterdayWaterSaving),
    lastMonthWaterSavingLiters: roundLiters(lastMonthWaterSaving),
    waterSavingComparePercent: waterSavingCompare.comparePercent,
    waterSavingTrend: waterSavingCompare.trend,
    deviceCount: deviceIds === null ? null : deviceIds.length,
  }
}
