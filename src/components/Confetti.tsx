'use client'

import { useEffect, useRef } from 'react'

interface ConfettiPiece {
  x: number
  y: number
  r: number
  d: number
  color: string
  tilt: number
  tiltAngleIncremental: number
  tiltAngle: number
}

interface ConfettiProps {
  active: boolean
  duration?: number
}

const colors = ['#FF6B35', '#FFF8F0', '#4CAF50', '#FFD700', '#FF69B4', '#00CED1']

export default function Confetti({ active, duration = 3000 }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const confettiRef = useRef<ConfettiPiece[]>([])
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    if (!active) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Initialize confetti
    const confettiCount = 150
    confettiRef.current = []

    for (let i = 0; i < confettiCount; i++) {
      confettiRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 6 + 4,
        d: Math.random() * confettiCount,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.floor(Math.random() * 10) - 10,
        tiltAngleIncremental: Math.random() * 0.07 + 0.05,
        tiltAngle: 0,
      })
    }

    startTimeRef.current = Date.now()

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const elapsed = Date.now() - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)

      confettiRef.current.forEach((c, i) => {
        ctx.beginPath()
        ctx.lineWidth = c.r / 2
        ctx.strokeStyle = c.color
        ctx.moveTo(c.x + c.tilt + c.r / 4, c.y)
        ctx.lineTo(c.x + c.tilt, c.y + c.tilt + c.r / 4)
        ctx.stroke()
      })

      update(progress)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(draw)
      }
    }

    const update = (progress: number) => {
      const opacity = 1 - progress

      confettiRef.current.forEach((c, i) => {
        c.tiltAngle += c.tiltAngleIncremental
        c.y += (Math.cos(c.d) + 3 + c.r / 2) * (1 - progress * 0.5)
        c.x += Math.sin(c.d) * 2
        c.tilt = Math.sin(c.tiltAngle) * 15

        if (c.y > canvas.height) {
          confettiRef.current[i] = {
            ...c,
            x: Math.random() * canvas.width,
            y: -10,
            tilt: Math.floor(Math.random() * 10) - 10,
          }
        }
      })
    }

    draw()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [active, duration])

  if (!active) return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      aria-hidden="true"
    />
  )
}
