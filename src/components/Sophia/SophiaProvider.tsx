'use client'

import dynamic from 'next/dynamic'

// Dynamic import for client-only Sophia chat component
const SophiaChat = dynamic(() => import('./SophiaChat'), { ssr: false })

export default function SophiaProvider() {
  return <SophiaChat />
}
