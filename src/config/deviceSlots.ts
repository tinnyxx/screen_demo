/** 逻辑设备槽位：与 pet_devices.id 一一对应，顺序固定为 01号、02号 */
export const DEVICE_SLOTS = [
  { id: 'STATION_001', label: '01号', deviceNo: 1 },
  { id: 'STATION_002', label: '02号', deviceNo: 2 },
] as const

export function formatDeviceNoLabel(deviceNo: number): string {
  return `${String(deviceNo).padStart(2, '0')}号`
}
