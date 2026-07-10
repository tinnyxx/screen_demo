import reportTemplate from '@/assets/report.png'
import {
  formatReportNumber,
  formatReportSubtitle,
  getMonthlyReportItem,
  monthlyReportImageSections,
  monthlyReportMock,
  type MonthlyReportData,
} from '@/mock/monthlyReport'

const FONT_FAMILY = '"Microsoft YaHei", "PingFang SC", sans-serif'

const REPORT_LAYOUT = {
  subtitleFontSize: 42,
  subtitleLetterSpacing: 10,
  subtitleBaseY: 0.395,
  subtitleOffsetY: 280,
  subtitleOffsetX: 210,
  sectionStartBaseY: 0.465,
  sectionOffsetY: 175,
  sectionGapRatio: 0.105,
  sectionGapReduce: 43,
  sectionBaseX: 0.37,
  sectionOffsetX: 95,
  valueFontSize: 100,
  unitFontSizeReduce: 10,
  labelFontSize: 52,
  labelColor: '#888888',
  valueDescGap: 20,
  footerFontSize: 30,
  footerLineSpacing: 60,
  footerColor: '#888888',
  footerOffsetFromBottom: 200,
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Failed to load report template image'))
    image.src = src
  })
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function drawSectionValue(
  ctx: CanvasRenderingContext2D,
  textX: number,
  sectionY: number,
  value: number,
  unit: string,
  decimals: number,
) {
  const numberText = formatReportNumber(value, decimals)
  const unitFontSize = REPORT_LAYOUT.valueFontSize - REPORT_LAYOUT.unitFontSizeReduce

  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillStyle = '#b46100'

  ctx.font = `bold ${REPORT_LAYOUT.valueFontSize}px ${FONT_FAMILY}`
  ctx.fillText(numberText, textX, sectionY)

  const numberWidth = ctx.measureText(numberText).width
  ctx.font = `bold ${unitFontSize}px ${FONT_FAMILY}`
  ctx.fillText(unit, textX + numberWidth, sectionY)
}

function drawFooterLines(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  lines: string[],
) {
  const lineStep = REPORT_LAYOUT.footerFontSize + REPORT_LAYOUT.footerLineSpacing
  const blockHeight = REPORT_LAYOUT.footerFontSize + (lines.length - 1) * lineStep
  const startY = height - REPORT_LAYOUT.footerOffsetFromBottom - blockHeight

  ctx.font = `${REPORT_LAYOUT.footerFontSize}px ${FONT_FAMILY}`
  ctx.fillStyle = REPORT_LAYOUT.footerColor
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  lines.forEach((line, index) => {
    ctx.fillText(line, width / 2, startY + index * lineStep)
  })
}

function drawReportContent(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  data: MonthlyReportData,
) {
  ctx.font = `${REPORT_LAYOUT.subtitleFontSize}px ${FONT_FAMILY}`
  ctx.fillStyle = '#888888'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.letterSpacing = `${REPORT_LAYOUT.subtitleLetterSpacing}px`
  ctx.fillText(
    formatReportSubtitle(data.meta),
    width / 2 - REPORT_LAYOUT.subtitleOffsetX,
    height * REPORT_LAYOUT.subtitleBaseY + REPORT_LAYOUT.subtitleOffsetY,
  )
  ctx.letterSpacing = '0px'

  const textX = width * REPORT_LAYOUT.sectionBaseX - REPORT_LAYOUT.sectionOffsetX
  const sectionGap = height * REPORT_LAYOUT.sectionGapRatio - REPORT_LAYOUT.sectionGapReduce

  monthlyReportImageSections.forEach((section, index) => {
    const item = getMonthlyReportItem(data, section.itemKey)
    if (!item) return

    const sectionY =
      height * REPORT_LAYOUT.sectionStartBaseY + index * sectionGap + REPORT_LAYOUT.sectionOffsetY

    drawSectionValue(ctx, textX, sectionY, item.current, item.unit, item.decimals)

    const labelY = sectionY + REPORT_LAYOUT.valueFontSize + REPORT_LAYOUT.valueDescGap

    ctx.font = `${REPORT_LAYOUT.labelFontSize}px ${FONT_FAMILY}`
    ctx.fillStyle = REPORT_LAYOUT.labelColor
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(section.label, textX, labelY)
  })

  drawFooterLines(ctx, width, height, data.footerLines)
}

export async function generateAndDownloadReportImage(
  data: MonthlyReportData = monthlyReportMock,
  filename = 'monthly-report.png',
) {
  const template = await loadImage(reportTemplate)
  const canvas = document.createElement('canvas')
  canvas.width = template.naturalWidth
  canvas.height = template.naturalHeight

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas is not supported in this browser')
  }

  ctx.drawImage(template, 0, 0, canvas.width, canvas.height)
  drawReportContent(ctx, canvas.width, canvas.height, data)

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/png')
  })

  if (!blob) {
    throw new Error('Failed to export report image')
  }

  downloadBlob(blob, filename)
}
