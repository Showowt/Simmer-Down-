'use client'

import dynamic from 'next/dynamic'

// Dynamic import for ANIMA Provider (client-side only)
const AnimaProvider = dynamic(
  () => import('@/components/Anima/AnimaProvider'),
  { ssr: false }
)

export default function ClientProviders() {
  return <AnimaProvider />
}
