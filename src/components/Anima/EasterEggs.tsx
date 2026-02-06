'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToastStore } from '@/components/Toast'

// Konami Code: ↑↑↓↓←→←→BA
const KONAMI_CODE = [
  'ArrowUp', 'ArrowUp',
  'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight',
  'ArrowLeft', 'ArrowRight',
  'KeyB', 'KeyA',
]

interface FallingPizza {
  id: number
  x: number
  rotation: number
  duration: number
  delay: number
}

export function KonamiPizzaRain() {
  const [isActive, setIsActive] = useState(false)
  const [pizzas, setPizzas] = useState<FallingPizza[]>([])
  const [keysPressed, setKeysPressed] = useState<string[]>([])
  const addToast = useToastStore((state) => state.addToast)

  const triggerPizzaRain = useCallback(() => {
    setIsActive(true)
    addToast('🎮 ¡KONAMI CODE ACTIVATED! 🍕', 'success')

    // Generate falling pizzas
    const newPizzas: FallingPizza[] = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      rotation: Math.random() * 720 - 360,
      duration: 3 + Math.random() * 2,
      delay: Math.random() * 2,
    }))
    setPizzas(newPizzas)

    // Stop after 5 seconds
    setTimeout(() => {
      setIsActive(false)
      setPizzas([])
    }, 6000)
  }, [addToast])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const newKeys = [...keysPressed, e.code].slice(-10)
      setKeysPressed(newKeys)

      // Check if Konami code is complete
      if (newKeys.length === 10 && newKeys.every((key, i) => key === KONAMI_CODE[i])) {
        triggerPizzaRain()
        setKeysPressed([])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [keysPressed, triggerPizzaRain])

  return (
    <AnimatePresence>
      {isActive && (
        <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">
          {pizzas.map((pizza) => (
            <motion.div
              key={pizza.id}
              initial={{ y: -100, x: `${pizza.x}vw`, rotate: 0, opacity: 1 }}
              animate={{
                y: '110vh',
                rotate: pizza.rotation,
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: pizza.duration,
                delay: pizza.delay,
                ease: 'linear',
              }}
              className="absolute text-6xl"
              style={{ left: `${pizza.x}%` }}
            >
              🍕
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}

export function SecretMenuTrigger() {
  const [clickCount, setClickCount] = useState(0)
  const [showSecret, setShowSecret] = useState(false)
  const addToast = useToastStore((state) => state.addToast)

  const handleLogoClick = () => {
    setClickCount((prev) => prev + 1)

    if (clickCount + 1 >= 7) {
      setShowSecret(true)
      addToast('🤫 Has descubierto el menú secreto...', 'info')
      setClickCount(0)
    }
  }

  return (
    <>
      {/* This component wraps the logo and tracks clicks */}
      <span onClick={handleLogoClick} className="cursor-pointer">
        {/* Logo content passed as children */}
      </span>

      <AnimatePresence>
        {showSecret && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/90 flex items-center justify-center p-6"
            onClick={() => setShowSecret(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-orange-500/50 p-8 max-w-md text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-6xl mb-4 block">🤫</span>
              <h3 className="text-2xl font-bold text-white mb-2">Menú Secreto</h3>
              <p className="text-zinc-400 mb-6">
                Has encontrado el menú secreto de Simmer Down.
                Menciona "El Código del Fundador" cuando ordenes.
              </p>
              <div className="bg-zinc-800 p-4 mb-6">
                <p className="text-orange-400 font-semibold">La Pizza del Chef</p>
                <p className="text-sm text-zinc-500">
                  Creación única del día - solo para quienes saben
                </p>
              </div>
              <button
                onClick={() => setShowSecret(false)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 font-semibold transition-colors"
              >
                Guardar el Secreto
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// Console Easter Egg Enhancement
export function EnhancedConsoleEasterEgg() {
  useEffect(() => {
    // ASCII Art
    console.log(`
%c
    ███████╗██╗███╗   ███╗███╗   ███╗███████╗██████╗
    ██╔════╝██║████╗ ████║████╗ ████║██╔════╝██╔══██╗
    ███████╗██║██╔████╔██║██╔████╔██║█████╗  ██████╔╝
    ╚════██║██║██║╚██╔╝██║██║╚██╔╝██║██╔══╝  ██╔══██╗
    ███████║██║██║ ╚═╝ ██║██║ ╚═╝ ██║███████╗██║  ██║
    ╚══════╝╚═╝╚═╝     ╚═╝╚═╝     ╚═╝╚══════╝╚═╝  ╚═╝

    ██████╗  ██████╗ ██╗    ██╗███╗   ██╗
    ██╔══██╗██╔═══██╗██║    ██║████╗  ██║
    ██║  ██║██║   ██║██║ █╗ ██║██╔██╗ ██║
    ██║  ██║██║   ██║██║███╗██║██║╚██╗██║
    ██████╔╝╚██████╔╝╚███╔███╔╝██║ ╚████║
    ╚═════╝  ╚═════╝  ╚══╝╚══╝ ╚═╝  ╚═══╝

`, 'color: #f97316; font-family: monospace;')

    console.log(
      '%c🍕 ¿Buscando algo? 🍕',
      'color: #f97316; font-size: 20px; font-weight: bold;'
    )

    console.log(
      '%cPrueba: SimmerDown.secretMenu()',
      'color: #a1a1aa; font-size: 14px;'
    )

    // Add secret functions to window
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>).SimmerDown = {
        secretMenu: () => {
          console.log('%c🤫 MENÚ SECRETO DESBLOQUEADO', 'color: #22c55e; font-size: 16px; font-weight: bold;')
          console.log('%cMenciona "El Código del Fundador" en tu próximo pedido', 'color: #a1a1aa;')
          console.log('%cPizza del Chef: Creación única del día - $24.99', 'color: #f97316;')
          return '🍕 Secreto guardado'
        },
        historia: () => {
          console.log('%c📖 LA HISTORIA DE SIMMER DOWN', 'color: #f97316; font-size: 16px; font-weight: bold;')
          console.log('%c2012: Todo comenzó en Santa Ana...', 'color: #a1a1aa;')
          console.log('%c2015: Abrimos Coatepeque con vista al lago', 'color: #a1a1aa;')
          console.log('%c2018: San Benito se convirtió en el punto urbano', 'color: #a1a1aa;')
          console.log('%c2021: Simmer Garden en la Ruta de las Flores', 'color: #a1a1aa;')
          console.log('%c2023: Surf City frente al mar', 'color: #a1a1aa;')
          console.log('%c2024: ANIMA nace - el alma digital', 'color: #22c55e;')
          return '12 años de historia'
        },
        team: () => {
          console.log('%c👨‍🍳 EL EQUIPO', 'color: #f97316; font-size: 16px; font-weight: bold;')
          console.log('%cGracias por curiosear. Somos un equipo pequeño', 'color: #a1a1aa;')
          console.log('%ccon grandes sueños. Cada pizza es un acto de amor.', 'color: #a1a1aa;')
          console.log('%c¿Quieres unirte? careers@simmerdown.sv', 'color: #22c55e;')
          return '❤️'
        },
        anima: () => {
          console.log('%c✨ ANIMA - EL ALMA DE SIMMER DOWN', 'color: #f97316; font-size: 16px; font-weight: bold;')
          console.log('%cNo soy un chatbot. Soy el alma digital del restaurante.', 'color: #a1a1aa;')
          console.log('%cRecuerdo cada visita, cada preferencia, cada momento.', 'color: #a1a1aa;')
          console.log('%cPorque en Simmer Down, cada cliente es familia.', 'color: #a1a1aa;')
          return 'Powered by MachineMind'
        },
      }
    }
  }, [])

  return null
}
