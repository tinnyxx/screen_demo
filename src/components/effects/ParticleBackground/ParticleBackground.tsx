import { useEffect, useRef } from 'react'
import styles from './ParticleBackground.module.scss'

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  size: number
}

type ParticleBackgroundProps = {
  className?: string
  particleCount?: number
  /** Particle fill RGB channels */
  color?: readonly [number, number, number]
  linkDistance?: number
}

const DEFAULT_COLOR = [64, 158, 255] as const

export function ParticleBackground({
  className,
  particleCount = 80,
  color = DEFAULT_COLOR,
  linkDistance = 140,
}: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const colorKey = color.join(',')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const parent = canvas.parentElement
    if (!parent) return

    let width = 0
    let height = 0
    let animationId = 0
    let particles: Particle[] = []
    let mouseX = -9999
    let mouseY = -9999
    let disposed = false
    const [cr, cg, cb] = colorKey.split(',').map(Number)

    const createParticles = () => {
      const density = Math.max(
        36,
        Math.min(particleCount, Math.floor((width * height) / 14000)),
      )
      particles = Array.from({ length: density }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.55,
        vy: (Math.random() - 0.5) * 0.55,
        size: Math.random() * 1.8 + 0.8,
      }))
    }

    const resize = () => {
      const rect = parent.getBoundingClientRect()
      width = Math.max(1, Math.floor(rect.width))
      height = Math.max(1, Math.floor(rect.height))
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      createParticles()
    }

    const draw = () => {
      if (disposed) return
      ctx.clearRect(0, 0, width, height)

      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy

        if (p.x < 0 || p.x > width) p.vx *= -1
        if (p.y < 0 || p.y > height) p.vy *= -1

        p.x = Math.max(0, Math.min(width, p.x))
        p.y = Math.max(0, Math.min(height, p.y))

        const dxMouse = p.x - mouseX
        const dyMouse = p.y - mouseY
        const distMouse = Math.hypot(dxMouse, dyMouse)
        if (distMouse < 120 && distMouse > 0) {
          const force = (120 - distMouse) / 120
          p.vx += (dxMouse / distMouse) * force * 0.08
          p.vy += (dyMouse / distMouse) * force * 0.08
        }

        const speed = Math.hypot(p.vx, p.vy)
        if (speed > 1.2) {
          p.vx = (p.vx / speed) * 1.2
          p.vy = (p.vy / speed) * 1.2
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, 0.85)`
        ctx.fill()

        for (let j = i + 1; j < particles.length; j += 1) {
          const q = particles[j]
          const dx = p.x - q.x
          const dy = p.y - q.y
          const dist = Math.hypot(dx, dy)
          if (dist < linkDistance) {
            const alpha = (1 - dist / linkDistance) * 0.35
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(q.x, q.y)
            ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${alpha})`
            ctx.lineWidth = 1
            ctx.stroke()
          }
        }
      }

      animationId = window.requestAnimationFrame(draw)
    }

    const handlePointerMove = (event: PointerEvent) => {
      const rect = parent.getBoundingClientRect()
      mouseX = event.clientX - rect.left
      mouseY = event.clientY - rect.top
    }

    const handlePointerLeave = () => {
      mouseX = -9999
      mouseY = -9999
    }

    resize()
    draw()

    const observer = new ResizeObserver(() => resize())
    observer.observe(parent)
    window.addEventListener('resize', resize)
    parent.addEventListener('pointermove', handlePointerMove)
    parent.addEventListener('pointerleave', handlePointerLeave)

    return () => {
      disposed = true
      window.cancelAnimationFrame(animationId)
      observer.disconnect()
      window.removeEventListener('resize', resize)
      parent.removeEventListener('pointermove', handlePointerMove)
      parent.removeEventListener('pointerleave', handlePointerLeave)
    }
  }, [colorKey, linkDistance, particleCount])

  return (
    <canvas
      ref={canvasRef}
      className={[styles.canvas, className].filter(Boolean).join(' ')}
      aria-hidden
    />
  )
}
