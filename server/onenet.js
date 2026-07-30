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

function postJson(path, body, authorization) {
  const payload = JSON.stringify(body)

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: API_HOST,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          authorization,
        },
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
    req.write(payload)
    req.end()
  })
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

/** 兼容 data 为数组（[{identifier, value}]）或对象（identifier→value）两种返回 */
function toPropertyMap(data) {
  if (Array.isArray(data)) {
    const map = {}
    for (const item of data) {
      if (item && item.identifier !== undefined) {
        map[item.identifier] = item.value
      }
    }
    return map
  }
  return data && typeof data === 'object' ? data : {}
}

/**
 * 查询设备物模型属性（identifier → value）。
 * 先批量查；平台批量校验失败（如某属性设备未实现）时降级为逐个查询。
 */
export async function queryDeviceProperties(deviceName, identifiers) {
  const { productId, productAccessKey } = getConfig()
  const authorization = buildAuthHeader(productId, productAccessKey)

  const batchResult = await postJson(
    '/thingmodel/query-device-property-detail',
    { product_id: productId, device_name: deviceName, params: identifiers },
    authorization,
  )

  if (batchResult.code === 0) {
    return toPropertyMap(batchResult.data)
  }

  const parsed = {}
  for (const identifier of identifiers) {
    try {
      const singleResult = await postJson(
        '/thingmodel/query-device-property-detail',
        { product_id: productId, device_name: deviceName, params: [identifier] },
        authorization,
      )
      if (singleResult.code === 0) {
        parsed[identifier] = toPropertyMap(singleResult.data)[identifier]
      }
    } catch (error) {
      console.warn(`OneNET 属性 ${identifier} 查询失败 (${deviceName}):`, error.message)
    }
  }
  return parsed
}

/**
 * 查询设备事件记录。warn 事件由业务层持久化，避免 OneNET 查询窗口外丢失。
 */
export async function queryDeviceEventLogs(
  deviceName,
  { identifier = 'warn', startTime, endTime = Date.now(), offset = 0, limit = 100 } = {},
) {
  const { productId, productAccessKey } = getConfig()
  const result = await getJson(
    '/device/event-log',
    {
      product_id: productId,
      device_name: deviceName,
      start_time: startTime,
      end_time: endTime,
      identifier,
      offset,
      limit,
    },
    buildAuthHeader(productId, productAccessKey),
  )

  if (result.code !== 0) {
    const error = new Error(result.msg || 'OneNET 设备事件查询失败')
    error.code = result.code
    throw error
  }

  return Array.isArray(result.data?.list) ? result.data.list : []
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
