'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Flame, Lock, MapPin, AlertCircle } from 'lucide-react'

const KITCHEN_SESSION_KEY = 'simmerdown-kitchen-session'

interface KitchenSession {
  token: string
  locationId: string
  locationName: string
  exp: number
}

function getSession(): KitchenSession | null {
  try {
    const raw = localStorage.getItem(KITCHEN_SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as KitchenSession
    if (session.exp < Date.now()) {
      localStorage.removeItem(KITCHEN_SESSION_KEY)
      return null
    }
    return session
  } catch {
    return null
  }
}

export default function KitchenLoginPage() {
  const router = useRouter()
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([])
  const [selectedLocation, setSelectedLocation] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  // Check for existing valid session
  useEffect(() => {
    const session = getSession()
    if (session) {
      router.replace('/kitchen/display')
      return
    }
    setCheckingSession(false)
  }, [router])

  // Fetch locations
  useEffect(() => {
    async function loadLocations() {
      const supabase = createClient()
      const { data } = await supabase
        .from('locations')
        .select('id, name')
        .eq('is_active', true)
        .order('name')
      if (data && data.length > 0) {
        setLocations(data)
        setSelectedLocation(data[0].id)
      }
    }
    loadLocations()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pin || !selectedLocation) return

    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/kitchen/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, locationId: selectedLocation }),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error || 'PIN incorrecto')
        setPin('')
        setLoading(false)
        return
      }

      // Store session
      const session: KitchenSession = {
        token: data.token,
        locationId: data.location.id,
        locationName: data.location.name,
        exp: Date.now() + 24 * 60 * 60 * 1000,
      }
      localStorage.setItem(KITCHEN_SESSION_KEY, JSON.stringify(session))

      router.replace('/kitchen/display')
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
      setLoading(false)
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#1F1D1A] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#FF6B35] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1F1D1A] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#FF6B35]/10 border border-[#FF6B35]/20 flex items-center justify-center mx-auto mb-4">
            <Flame className="w-10 h-10 text-[#FF6B35]" />
          </div>
          <h1 className="text-2xl font-bold text-[#FFF8F0] font-display">
            Cocina
          </h1>
          <p className="text-[#6B6560] text-sm mt-1">
            Simmer Down — Sistema de Pedidos
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-[#252320] border border-[#3D3936] p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Ubicación
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] px-4 py-3 focus:outline-none focus:border-[#FF6B35] text-lg"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* PIN */}
          <div>
            <label className="block text-sm font-medium text-[#B8B0A8] mb-2">
              <Lock className="w-4 h-4 inline mr-1" />
              PIN de Acceso
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="Ingresa el PIN"
              className="w-full bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:border-[#FF6B35] placeholder:text-[#3D3936] placeholder:text-base placeholder:tracking-normal"
              autoFocus
              autoComplete="off"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !pin || pin.length < 4}
            className="w-full bg-[#FF6B35] hover:bg-[#E55A2B] disabled:bg-[#3D3936] disabled:text-[#6B6560] text-white py-4 font-semibold text-lg transition-colors flex items-center justify-center gap-2 min-h-[56px]"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin" />
                Verificando...
              </>
            ) : (
              'Entrar a Cocina'
            )}
          </button>
        </form>

        <p className="text-center text-[#3D3936] text-xs mt-6">
          Solicita el PIN a tu administrador
        </p>
      </div>
    </div>
  )
}
