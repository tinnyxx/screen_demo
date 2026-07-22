import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { sql } from './start.js'

const app = express()
const PORT = Number(process.env.PORT || 3001)
const WEATHER_UPSTREAM = 'https://uapis.cn/api/v1/misc/weather'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '../dist')

app.use(cors())
app.use(express.json())

app.get('/api/weather', async (req, res) => {
  try {
    const query = new URLSearchParams()

    if (req.query.city) query.set('city', String(req.query.city))
    if (req.query.lang) query.set('lang', String(req.query.lang))

    const upstream = `${WEATHER_UPSTREAM}${query.size ? `?${query.toString()}` : ''}`
    const response = await fetch(upstream)

    if (!response.ok) {
      return res.status(response.status).json({ message: '天气服务暂时不可用' })
    }

    const data = await response.json()
    return res.json(data)
  } catch (error) {
    console.error('Weather proxy failed:', error)
    return res.status(503).json({ message: '天气服务暂时不可用' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  const username = String(req.body?.username ?? '').trim()
  const password = String(req.body?.password ?? '')

  if (!username || !password) {
    return res.status(400).json({ message: '用户名和密码不能为空' })
  }

  try {
    const rows = await sql`
      SELECT username, nickname, password
      FROM admin_tb
      WHERE username = ${username}
      LIMIT 1
    `

    const admin = rows[0]

    if (!admin || admin.password !== password) {
      return res.status(401).json({ message: '用户名或密码错误' })
    }

    return res.json({
      username: admin.username,
      nickname: admin.nickname,
    })
  } catch (error) {
    console.error('Login failed:', error)
    return res.status(500).json({ message: '服务器错误，请稍后重试' })
  }
})

function normalizeRedeemCode(raw) {
  return String(raw ?? '').trim()
}

const VALID_COMMUNITY_IDS = new Set(['lanwan', 'huarun'])

function normalizeCommunityId(raw) {
  const value = String(raw ?? '').trim()
  return VALID_COMMUNITY_IDS.has(value) ? value : null
}

function mapRedeemCodeRow(row) {
  return {
    code: String(row.code ?? '').trim(),
    productId: row.product_id,
    productName: row.product_name,
    img: row.img,
    cost: row.cost,
    validFrom: row.valid_from,
    validTo: row.valid_to,
    validRange: row.valid_range,
    status: row.status,
    communityId: row.community_id ?? null,
    assignedUserId: row.assigned_user_id,
    userNickname: row.user_nickname,
    userPhone: row.user_phone,
    assignedAt: row.assigned_at,
    usedAt: row.used_at,
    redeemedAt: row.redeemed_at,
    canVerify: row.status === 'assigned',
  }
}

async function findRedeemCode(code) {
  const rows = await sql`
    SELECT
      rc.code,
      rc.product_id,
      rc.status,
      rc.community_id,
      rc.assigned_user_id,
      rc.assigned_at,
      rc.used_at,
      rr.product_name,
      rr.img,
      rr.cost,
      rr.valid_from,
      rr.valid_to,
      rr.valid_range,
      rr.redeemed_at,
      u.nickname AS user_nickname,
      u.phone AS user_phone
    FROM redeem_codes rc
    LEFT JOIN redeem_records rr ON rc.redeem_record_id = rr.id
    LEFT JOIN users u ON rc.assigned_user_id = u.id
    WHERE TRIM(rc.code) = ${code}
    LIMIT 1
  `
  return rows[0] ?? null
}

app.get('/api/redeem/lookup', async (req, res) => {
  const code = normalizeRedeemCode(req.query.code)

  if (!code || code.length !== 18) {
    return res.status(400).json({ message: '请输入18位兑换码' })
  }

  try {
    const row = await findRedeemCode(code)
    if (!row) {
      return res.status(404).json({ message: '兑换码不存在' })
    }

    return res.json(mapRedeemCodeRow(row))
  } catch (error) {
    console.error('Redeem lookup failed:', error)
    return res.status(500).json({ message: '服务器错误，请稍后重试' })
  }
})

app.post('/api/redeem/verify', async (req, res) => {
  const code = normalizeRedeemCode(req.body?.code)
  const communityId = normalizeCommunityId(req.body?.communityId)

  if (!code || code.length !== 18) {
    return res.status(400).json({ message: '请输入18位兑换码' })
  }

  if (!communityId) {
    return res.status(400).json({ message: '请指定核销小区（lanwan / huarun）' })
  }

  try {
    const updated = await sql`
      UPDATE redeem_codes
      SET
        status = 'used',
        used_at = CURRENT_TIMESTAMP,
        community_id = ${communityId}
      WHERE TRIM(code) = ${code} AND status = 'assigned'
      RETURNING code, status, used_at, community_id
    `

    if (!updated[0]) {
      const existing = await findRedeemCode(code)

      if (!existing) {
        return res.status(404).json({ message: '兑换码不存在' })
      }

      if (existing.status === 'used') {
        return res.status(409).json({ message: '该兑换码已核销' })
      }
      if (existing.status === 'void') {
        return res.status(409).json({ message: '该兑换码已作废' })
      }
      if (existing.status === 'available') {
        return res.status(409).json({ message: '该兑换码尚未发放，无法核销' })
      }
      return res.status(409).json({ message: '当前状态不可核销' })
    }

    const row = await findRedeemCode(code)
    return res.json({
      message: '核销成功',
      ...mapRedeemCodeRow(row),
    })
  } catch (error) {
    console.error('Redeem verify failed:', error)
    return res.status(500).json({ message: '服务器错误，请稍后重试' })
  }
})

app.get('/api/redeem/stats', async (req, res) => {
  const communityId = normalizeCommunityId(req.query.communityId)

  try {
    const rows = communityId
      ? await sql`
          SELECT
            rc.code,
            rc.product_id,
            rc.community_id,
            rc.used_at,
            rr.product_name,
            u.nickname AS user_nickname,
            u.phone AS user_phone
          FROM redeem_codes rc
          LEFT JOIN redeem_records rr ON rc.redeem_record_id = rr.id
          LEFT JOIN users u ON rc.assigned_user_id = u.id
          WHERE rc.status = 'used'
            AND rc.community_id = ${communityId}
          ORDER BY rc.used_at DESC NULLS LAST, rc.code ASC
        `
      : await sql`
          SELECT
            rc.code,
            rc.product_id,
            rc.community_id,
            rc.used_at,
            rr.product_name,
            u.nickname AS user_nickname,
            u.phone AS user_phone
          FROM redeem_codes rc
          LEFT JOIN redeem_records rr ON rc.redeem_record_id = rr.id
          LEFT JOIN users u ON rc.assigned_user_id = u.id
          WHERE rc.status = 'used'
            AND rc.community_id IS NOT NULL
          ORDER BY rc.used_at DESC NULLS LAST, rc.code ASC
        `

    const productTypeMap = new Map()
    const communityMap = new Map()

    for (const row of rows) {
      const productKey = row.product_id || row.product_name || 'unknown'
      const productName = row.product_name || row.product_id || '未知礼品'
      const existingProduct = productTypeMap.get(productKey)
      if (existingProduct) {
        existingProduct.count += 1
      } else {
        productTypeMap.set(productKey, {
          productId: row.product_id,
          productName,
          count: 1,
        })
      }

      const cid = row.community_id
      if (!communityMap.has(cid)) {
        communityMap.set(cid, {
          communityId: cid,
          total: 0,
          productTypes: new Map(),
          codes: [],
        })
      }
      const community = communityMap.get(cid)
      community.total += 1
      community.codes.push({
        code: String(row.code ?? '').trim(),
        productId: row.product_id,
        productName,
        communityId: cid,
        usedAt: row.used_at,
        userNickname: row.user_nickname,
        userPhone: row.user_phone,
      })

      const communityProduct = community.productTypes.get(productKey)
      if (communityProduct) {
        communityProduct.count += 1
      } else {
        community.productTypes.set(productKey, {
          productId: row.product_id,
          productName,
          count: 1,
        })
      }
    }

    const byCommunity = Array.from(communityMap.values()).map((item) => ({
      communityId: item.communityId,
      total: item.total,
      productTypes: Array.from(item.productTypes.values()),
      codes: item.codes,
    }))

    return res.json({
      total: rows.length,
      productTypeCount: productTypeMap.size,
      productTypes: Array.from(productTypeMap.values()),
      byCommunity,
      records: rows.map((row) => ({
        code: String(row.code ?? '').trim(),
        productId: row.product_id,
        productName: row.product_name || row.product_id || '未知礼品',
        communityId: row.community_id,
        usedAt: row.used_at,
        userNickname: row.user_nickname,
        userPhone: row.user_phone,
      })),
    })
  } catch (error) {
    console.error('Redeem stats failed:', error)
    return res.status(500).json({ message: '服务器错误，请稍后重试' })
  }
})

app.use(express.static(distDir))

app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
