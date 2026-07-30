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
    { id: '1', label: '1号设备', left: 32, top: 38, offsetX: 183, offsetY: 270 },
    { id: '2', label: '2号设备', left: 32, top: 38, offsetX: 413, offsetY: 270 },
  ],
}
