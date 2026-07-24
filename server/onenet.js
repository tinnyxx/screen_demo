import crypto from 'crypto'
import https from 'https'

const API_HOST = 'iot-api.heclouds.com'

const DEVICE_STATUS_MAP = {
  0: 'offline',
  1: 'online',
  2: 'inactive',
}

function getConfig() {
  return {
    productId: process.env.ONENET_PRODUCT_ID || '8Y7naQMul0',
    productAccessKey:
      process.env.ONENET_PRODUCT_ACCESS_KEY ||
      'IV3f3/mfkf39a1+dVVFpH9mHpTVfnZnxSa23I1fXeTs=',
  }
}

function generateAuthorization(method, res, accessKey, expireSeconds = 3600) {
  const version = '2022-05-01'
  const et = Math.ceil(Date.now() / 1000) + expireSeconds
  const base64Key = Buffer.from(accessKey, 'base64')
  const stringForSignature = `${et}\n${method}\n${res}\n${version}`
  const sign = encodeURIComponent(
    crypto.createHmac(method, base64Key).update(stringForSignature).digest('base64'),
  )

  return `version=${version}&res=${encodeURIComponent(res)}&et=${et}&method=${method}&sign=${sign}`
}

function buildAuthHeader(productId, productAccessKey) {
  return generateAuthorization('sha1', `products/${productId}`, productAccessKey)
}

function getJson(path, query, authorization) {
  const queryStr = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&')

  const fullPath = queryStr ? `${path}?${queryStr}` : path

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: API_HOST,
        path: fullPath,
        method: 'GET',
        headers: { authorization },
      },
      (res) => {
        let data = ''
        res.on('data', (chunk) => {
          data += chunk
        })
        res.on('end', () => {
          try {
            resolve(JSON.parse(data))
          } catch {
            reject(new Error(`OneNET 响应解析失败: ${data}`))
          }
        })
      },
    )

    req.on('error', reject)
    req.end()
  })
}

async function queryDeviceListPage({ productId, productAccessKey, offset = 0, limit = 100 }) {
  const result = await getJson(
    '/device/list',
    {
      product_id: productId,
      offset,
      limit,
    },
    buildAuthHeader(productId, productAccessKey),
  )

  if (result.code !== 0) {
    const message = result.msg || 'OneNET 设备列表查询失败'
    const error = new Error(message)
    error.code = result.code
    throw error
  }

  return result.data
}

export async function getAllDeviceStatuses() {
  const { productId, productAccessKey } = getConfig()
  const allDevices = []
  let offset = 0
  const pageSize = 100

  while (true) {
    const page = await queryDeviceListPage({
      productId,
      productAccessKey,
      offset,
      limit: pageSize,
    })

    if (!page || !Array.isArray(page.list)) break

    allDevices.push(...page.list)
    if (page.list.length < pageSize) break
    offset += pageSize
  }

  const devices = allDevices.map((device) => {
    const status = Number(device.status)
    return {
      did: device.did,
      name: device.name,
      status,
      statusKey: DEVICE_STATUS_MAP[status] ?? 'unknown',
      lastTime: device.last_time || device.last_connect_time || null,
    }
  })

  const summary = {
    total: devices.length,
    online: devices.filter((device) => device.status === 1).length,
    offline: devices.filter((device) => device.status === 0).length,
    inactive: devices.filter((device) => device.status === 2).length,
  }

  return { productId, devices, summary }
}
