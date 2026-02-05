'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  opacity: number
}

export default function FireParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Create particles
    const createParticle = (): Particle => {
      return {
        x: Math.random() * canvas.width,
        y: canvas.height + 10,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -Math.random() * 2 - 1,
        life: 0,
        maxLife: Math.random() * 200 + 100,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.6 + 0.2,
      }
    }

    // Initialize particles
    for (let i = 0; i < 30; i++) {
      const p = createParticle()
      p.y = Math.random() * canvas.height
      p.life = Math.random() * p.maxLife
      particlesRef.current.push(p)
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particlesRef.current.forEach((p, index) => {
        p.life++
        p.x += p.vx
        p.y += p.vy

        // Slight horizontal drift
        p.vx += (Math.random() - 0.5) * 0.02

        const lifeRatio = p.life / p.maxLife
        const alpha = p.opacity * (1 - lifeRatio)

        // Gradient from orange to yellow
        const gradient = ctx.createRadialGradient(
          p.x, p.y, 0,
          p.x, p.y, p.size * 2
        )
        gradient.addColorStop(0, `rgba(255, 150, 50, ${alpha})`)
        gradient.addColorStop(0.5, `rgba(255, 100, 30, ${alpha * 0.5})`)
        gradient.addColorStop(1, `rgba(255, 50, 0, 0)`)

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * (1 + lifeRatio), 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()

        // Reset particle when life ends or goes off screen
        if (p.life >= p.maxLife || p.y < -10) {
          particlesRef.current[index] = createParticle()
        }
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10"
      style={{ mixBlendMode: 'screen' }}
      aria-hidden="true"
    />
  )
}
