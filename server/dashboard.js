import { sql } from './start.js'

export const VALID_COMMUNITY_IDS = new Set(['lanwan', 'huarun'])

export function normalizeCommunityId(raw) {
  const value = String(raw ?? '').trim()
  return VALID_COMMUNITY_IDS.has(value) ? value : null
}

/**
 * 大屏 communityId（lanwan|huarun）→ pet_devices.id 列表
 * communities.code → pet_devices.community_id（整数 FK）
 */
async function resolveCommunityDeviceIds(communityId) {
  if (!communityId) return null

  const rows = await sql`
    SELECT d.id
    FROM pet_devices d
    INNER JOIN communities c ON c.id = d.community_id
    WHERE c.code = ${communityId}
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

async function queryHourlyForOffset(dayOffset, deviceIds) {
  // deviceIds === null → 全局；[] → 该小区无设备，直接全 0
  if (Array.isArray(deviceIds) && deviceIds.length === 0) {
    return fillHourlyCounts([])
  }

  const rows =
    deviceIds === null
      ? await sql`
          SELECT EXTRACT(HOUR FROM checkin_time)::int AS hour,
                 COUNT(*)::int AS count
          FROM checkin_records
          WHERE checkin_date = ((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Shanghai')::date - ${dayOffset}::int)
            AND COALESCE(status, 'success') = 'success'
          GROUP BY 1
        `
      : await sql`
          SELECT EXTRACT(HOUR FROM checkin_time)::int AS hour,
                 COUNT(*)::int AS count
          FROM checkin_records
          WHERE checkin_date = ((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Shanghai')::date - ${dayOffset}::int)
            AND COALESCE(status, 'success') = 'success'
            AND device_id = ANY(${deviceIds})
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

export async function getHourlyStats(communityId = null) {
  const { today, yesterday } = await getShanghaiDates()
  const deviceIds = await resolveCommunityDeviceIds(communityId)
  const [todayHourly, yesterdayHourly] = await Promise.all([
    queryHourlyForOffset(0, deviceIds),
    queryHourlyForOffset(1, deviceIds),
  ])
  return { today, yesterday, todayHourly, yesterdayHourly }
}

export async function getTodayTotal(communityId = null) {
  const [{ today }] = await sql`
    SELECT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Shanghai')::date::text AS today
  `
  const deviceIds = await resolveCommunityDeviceIds(communityId)

  if (Array.isArray(deviceIds) && deviceIds.length === 0) {
    return { date: today, total: 0 }
  }

  const [row] =
    deviceIds === null
      ? await sql`
          SELECT COUNT(*)::int AS total
          FROM checkin_records
          WHERE checkin_date = ${today}::date
            AND COALESCE(status, 'success') = 'success'
        `
      : await sql`
          SELECT COUNT(*)::int AS total
          FROM checkin_records
          WHERE checkin_date = ${today}::date
            AND COALESCE(status, 'success') = 'success'
            AND device_id = ANY(${deviceIds})
        `

  return { date: today, total: Number(row?.total) || 0 }
}

export async function getYesterdayTotal(communityId = null) {
  const deviceIds = await resolveCommunityDeviceIds(communityId)

  if (Array.isArray(deviceIds) && deviceIds.length === 0) {
    return 0
  }

  const [row] =
    deviceIds === null
      ? await sql`
          SELECT COUNT(*)::int AS total
          FROM checkin_records
          WHERE checkin_date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Shanghai')::date - 1
            AND COALESCE(status, 'success') = 'success'
        `
      : await sql`
          SELECT COUNT(*)::int AS total
          FROM checkin_records
          WHERE checkin_date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Shanghai')::date - 1
            AND COALESCE(status, 'success') = 'success'
            AND device_id = ANY(${deviceIds})
        `

  return Number(row?.total) || 0
}

/** month: 'YYYY-MM'；缺省为上海时区上月 */
export async function getMonthlyTotal(month, communityId = null) {
  let monthKey = String(month ?? '').trim()

  if (!/^\d{4}-\d{2}$/.test(monthKey)) {
    const dates = await getShanghaiDates()
    monthKey = dates.last_month
  }

  const startDate = `${monthKey}-01`
  const deviceIds = await resolveCommunityDeviceIds(communityId)

  if (Array.isArray(deviceIds) && deviceIds.length === 0) {
    return { month: monthKey, total: 0 }
  }

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
            AND device_id = ANY(${deviceIds})
        `

  return {
    month: monthKey,
    total: Number(row?.total) || 0,
  }
}

/** 大屏一轮询：小时曲线 + 今日总计 + 上月累计 */
export async function getCheckinDashboardStats(communityId = null) {
  const [hourly, todayTotal, yesterdayTotal, monthly] = await Promise.all([
    getHourlyStats(communityId),
    getTodayTotal(communityId),
    getYesterdayTotal(communityId),
    getMonthlyTotal(null, communityId),
  ])

  const today = todayTotal.total
  const yesterday = yesterdayTotal
  let comparePercent = 0
  let trend = 'up'

  if (yesterday > 0) {
    comparePercent = Number((((today - yesterday) / yesterday) * 100).toFixed(1))
    trend = today >= yesterday ? 'up' : 'down'
  } else if (today > 0) {
    comparePercent = 100
    trend = 'up'
  }

  return {
    communityId,
    ...hourly,
    todayTotal: todayTotal.total,
    yesterdayTotal: yesterday,
    comparePercent: Math.abs(comparePercent),
    trend,
    lastMonth: monthly.month,
    lastMonthTotal: monthly.total,
  }
}
