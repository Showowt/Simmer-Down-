'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useAnimaStore } from '@/store/anima'

// Dynamic imports for client-only ANIMA components
const AnimaChat = dynamic(() => import('./AnimaChat'), { ssr: false })
const KonamiPizzaRain = dynamic(
  () => import('./EasterEggs').then((mod) => ({ default: mod.KonamiPizzaRain })),
  { ssr: false }
)
const EnhancedConsoleEasterEgg = dynamic(
  () => import('./EasterEggs').then((mod) => ({ default: mod.EnhancedConsoleEasterEgg })),
  { ssr: false }
)

export default function AnimaProvider({ children }: { children: React.ReactNode }) {
  const incrementVisit = useAnimaStore((state) => state.incrementVisit)

  useEffect(() => {
    // Track visit on mount
    incrementVisit()
  }, [incrementVisit])

  return (
    <>
      {children}
      <AnimaChat />
      <KonamiPizzaRain />
      <EnhancedConsoleEasterEgg />
    </>
  )
}
