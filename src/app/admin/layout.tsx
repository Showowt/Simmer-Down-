'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Flame
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/admin', label: 'Panel', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Pedidos', icon: ShoppingBag },
  { href: '/admin/menu', label: 'Menú', icon: UtensilsCrossed },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login?redirect=/admin')
      } else {
        setUserEmail(user.email || null)
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1F1D1A] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#FF6B35] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1F1D1A]">
      {/* Mobile header */}
      <div className="lg:hidden bg-[#252320] border-b border-[#3D3936] px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-lg text-[#FFF8F0] flex items-center gap-2">
          <Flame className="w-6 h-6 text-[#FF6B35]" /> Admin
        </span>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-[#FFF8F0]">
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#252320] border-r border-[#3D3936] transform transition-transform lg:transform-none ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="p-6 border-b border-[#3D3936] hidden lg:block">
            <Link href="/admin" className="flex items-center gap-2">
              <Flame className="w-7 h-7 text-[#FF6B35]" />
              <span className="font-bold text-xl text-[#FFF8F0]">Simmer Down</span>
            </Link>
            <p className="text-sm text-[#6B6560] mt-1">Panel de Administración</p>
          </div>

          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 transition ${
                    isActive
                      ? 'bg-[#FF6B35] text-white'
                      : 'text-[#B8B0A8] hover:bg-[#3D3936] hover:text-[#FFF8F0]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Link>
              )
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#3D3936]">
            {userEmail && (
              <div className="px-4 py-2 mb-2">
                <p className="text-xs text-[#6B6560]">Conectado como</p>
                <p className="text-sm text-[#B8B0A8] truncate">{userEmail}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full text-[#B8B0A8] hover:bg-[#3D3936] hover:text-[#FFF8F0] transition"
            >
              <LogOut className="w-5 h-5" />
              Cerrar Sesión
            </button>
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 w-full text-[#6B6560] hover:text-[#B8B0A8] text-sm transition mt-2"
            >
              ← Volver al Sitio
            </Link>
          </div>
        </aside>

        {/* Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
