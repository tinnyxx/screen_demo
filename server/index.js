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

app.use(express.static(distDir))

app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
