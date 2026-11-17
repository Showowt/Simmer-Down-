'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'

// Dynamic import for ANIMA Provider (client-side only)
const AnimaProvider = dynamic(
  () => import('@/components/Anima/AnimaProvider'),
  { ssr: false }
)

// La Llamita is the customer concierge. The staff panel doesn't get it: its
// floating button sat on top of the door scanner's "Admitir" button.
function isStaffPanel(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

export default function ClientProviders() {
  const pathname = usePathname() ?? ''
  if (isStaffPanel(pathname)) return null
  return <AnimaProvider />
}
