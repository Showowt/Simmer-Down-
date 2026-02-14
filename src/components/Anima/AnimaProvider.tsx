'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useAnimaStore } from '@/store/anima'

// Dynamic imports for client-only ANIMA components
// Using V2 with full AI capabilities
const AnimaChat = dynamic(() => import('./AnimaChatV2'), { ssr: false })
const KonamiPizzaRain = dynamic(
  () => import('./EasterEggs').then((mod) => ({ default: mod.KonamiPizzaRain })),
  { ssr: false }
)
const EnhancedConsoleEasterEgg = dynamic(
  () => import('./EasterEggs').then((mod) => ({ default: mod.EnhancedConsoleEasterEgg })),
  { ssr: false }
)

export default function AnimaProvider() {
  const incrementVisit = useAnimaStore((state) => state.incrementVisit)

  useEffect(() => {
    // Track visit on mount
    incrementVisit()
  }, [incrementVisit])

  return (
    <>
      <AnimaChat />
      <KonamiPizzaRain />
      <EnhancedConsoleEasterEgg />
    </>
  )
}
