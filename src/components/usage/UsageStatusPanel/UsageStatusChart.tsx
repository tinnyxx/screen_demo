import { useEffect, useRef } from 'react'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import LinearGradient from 'zrender/lib/graphic/LinearGradient.js'
import type { UsageStatusData } from '@/mock/usageStatus'
import styles from './UsageStatusPanel.module.scss'

echarts.use([LineChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer])

interface UsageStatusChartProps {
  data: UsageStatusData
}

function createAreaGradient(areaColor: string) {
  return new LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: areaColor },
    { offset: 1, color: 'rgba(0, 0, 0, 0)' },
  ])
}

export function UsageStatusChart({ data }: UsageStatusChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = chartRef.current
    if (!container) return

    const chart = echarts.init(container)

    chart.setOption({
      animation: false,
      grid: {
        top: 36,
        right: 12,
        bottom: 24,
        left: 36,
      },
      legend: {
        top: 4,
        right: 8,
        itemWidth: 12,
        itemHeight: 2,
        itemGap: 12,
        textStyle: {
          color: 'rgba(255, 255, 255, 0.75)',
          fontSize: 11,
        },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(10, 15, 29, 0.9)',
        borderColor: 'rgba(64, 158, 255, 0.25)',
        textStyle: { color: '#fff', fontSize: 11 },
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: data.times,
        axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.15)' } },
        axisTick: { show: false },
        axisLabel: {
          color: 'rgba(255, 255, 255, 0.45)',
          fontSize: 10,
          interval: 2,
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: data.yAxisLabels[data.yAxisLabels.length - 1] ?? 20,
        interval: data.yAxisLabels.length > 1
          ? (data.yAxisLabels[1] ?? 5)
          : 5,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: 'rgba(255, 255, 255, 0.45)',
          fontSize: 10,
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.08)',
            type: 'dashed',
          },
        },
      },
      series: data.series.map((item) => ({
        name: item.name,
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: {
          width: 2,
          color: item.color,
        },
        itemStyle: {
          color: item.color,
        },
        areaStyle: {
          color: createAreaGradient(item.areaColor),
        },
        data: item.data,
      })),
    })

    const handleResize = () => chart.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.dispose()
    }
  }, [data])

  return <div ref={chartRef} className={styles.chart} aria-label="实时使用情况折线图" />
}
