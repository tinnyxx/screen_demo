import { useEffect, useRef } from 'react'
import * as echarts from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import LinearGradient from 'zrender/lib/graphic/LinearGradient.js'
import type { EquipmentStatusLegendItem } from '@/mock/equipmentStatus'
import styles from './EquipmentStatusPanel.module.scss'

echarts.use([PieChart, CanvasRenderer])

interface EquipmentStatusChartProps {
  legend: EquipmentStatusLegendItem[]
}

/** 圆环扇区逆时针方向线性渐变（相对扇区自身坐标系） */
function createCounterClockwiseGradient(from: string, to: string) {
  return new LinearGradient(
    1,
    0,
    0,
    1,
    [
      { offset: 0, color: from },
      { offset: 1, color: to },
    ],
    false,
  )
}

export function EquipmentStatusChart({ legend }: EquipmentStatusChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = chartRef.current
    if (!container) return

    const chart = echarts.init(container)
    const seriesData = legend
      .filter((item) => item.count > 0)
      .map((item) => ({
        name: item.label,
        value: item.count,
        itemStyle: {
          color: createCounterClockwiseGradient(item.gradientFrom, item.gradientTo),
        },
      }))

    chart.setOption({
      animation: false,
      series: [
        {
          type: 'pie',
          radius: ['76%', '88%'],
          center: ['50%', '50%'],
          startAngle: 90,
          clockwise: false,
          padAngle: 3,
          itemStyle: {
            borderColor: 'transparent',
            borderWidth: 2,
          },
          label: { show: false },
          labelLine: { show: false },
          data: seriesData,
        },
      ],
    })

    const handleResize = () => chart.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.dispose()
    }
  }, [legend])

  return <div ref={chartRef} className={styles.chartCanvas} aria-hidden="true" />
}
