export interface MapDeviceMarker {
  id: string
  label: string
  left: number
  top: number
  offsetX: number
  offsetY: number
}

export interface MapDevicesData {
  markers: MapDeviceMarker[]
}

export const mapDevicesMock: MapDevicesData = {
  markers: [
    { id: '1', label: '1号设备', left: 32, top: 38, offsetX: -37, offsetY: 0 },
    { id: '2', label: '2号设备', left: 52, top: 32, offsetX: -10, offsetY: 0 },
    { id: '3', label: '3号设备', left: 42, top: 58, offsetX: 73, offsetY: 65 },
    { id: '4', label: '4号设备', left: 64, top: 50, offsetX: 20, offsetY: 10 },
  ],
}
