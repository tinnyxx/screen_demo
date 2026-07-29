import { sql } from './start.js'

export const VALID_COMMUNITY_IDS = new Set(['lanwan', 'huarun'])

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

  return rows.map((row) => String(row.id))
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

/** 大屏一轮询：小时曲线 + 今日总计 + 上月累计 */
export async function getCheckinDashboardStats(communityId = null) {
  const dates = await getShanghaiDates()
  const deviceIds = await getCommunityDeviceIds(communityId)

  const [todayHourly, yesterdayHourly, todayTotal, yesterdayTotal, lastMonthTotal] =
    await Promise.all([
      queryHourlyForDate(dates.today, deviceIds),
      queryHourlyForDate(dates.yesterday, deviceIds),
      countSuccessOnDate(dates.today, deviceIds),
      countSuccessOnDate(dates.yesterday, deviceIds),
      countSuccessInMonth(dates.last_month, deviceIds),
    ])

  let comparePercent = 0
  let trend = 'up'

  if (yesterdayTotal > 0) {
    comparePercent = Number((((todayTotal - yesterdayTotal) / yesterdayTotal) * 100).toFixed(1))
    trend = todayTotal >= yesterdayTotal ? 'up' : 'down'
  } else if (todayTotal > 0) {
    comparePercent = 100
    trend = 'up'
  }

  return {
    communityId,
    today: dates.today,
    yesterday: dates.yesterday,
    todayHourly,
    yesterdayHourly,
    todayTotal,
    yesterdayTotal,
    comparePercent: Math.abs(comparePercent),
    trend,
    lastMonth: dates.last_month,
    lastMonthTotal,
    deviceCount: deviceIds === null ? null : deviceIds.length,
  }
}
