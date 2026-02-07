'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Phone, AlertCircle, Flame, Eye, EyeOff, Check, Gift } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const passwordRequirements = [
    { met: formData.password.length >= 8, text: 'Mínimo 8 caracteres' },
    { met: /[A-Z]/.test(formData.password), text: 'Una letra mayúscula' },
    { met: /[0-9]/.test(formData.password), text: 'Un número' },
  ]

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    // Validate password requirements
    if (!passwordRequirements.every(req => req.met)) {
      setError('La contraseña no cumple con los requisitos')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      // Sign up the user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            phone: formData.phone,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) throw signUpError

      // If user was created successfully, create their customer profile
      if (data.user) {
        // Try customers table first (production schema)
        const { error: customerError } = await supabase
          .from('customers')
          .insert({
            auth_user_id: data.user.id,
            email: formData.email,
            first_name: formData.name.split(' ')[0],
            last_name: formData.name.split(' ').slice(1).join(' ') || null,
            phone: formData.phone || null,
            loyalty_points_balance: 50, // Welcome bonus!
            loyalty_tier: 'bronze',
          })

        // Fallback to profiles table if customers doesn't exist
        if (customerError && customerError.message.includes('does not exist')) {
          await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              full_name: formData.name,
              phone: formData.phone,
              loyalty_points: 50,
              loyalty_tier: 'bronze',
            })
        }
      }

      setSuccess(true)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear cuenta'
      if (errorMessage.includes('already registered')) {
        setError('Este correo ya está registrado. ¿Quieres iniciar sesión?')
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#2D2A26] flex items-center justify-center px-4 pt-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <div className="bg-[#252320] border border-[#3D3936] p-8">
            <div className="w-20 h-20 bg-[#4CAF50]/10 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-[#4CAF50]" />
            </div>
            <h1 className="text-2xl font-bold text-[#FFF8F0] mb-4">¡Cuenta Creada!</h1>
            <p className="text-[#B8B0A8] mb-6">
              Hemos enviado un correo de confirmación a <strong className="text-[#FFF8F0]">{formData.email}</strong>.
              Por favor revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
            </p>
            <div className="bg-[#FF6B35]/10 border border-[#FF6B35]/20 p-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-[#FF6B35] font-medium">
                <Gift className="w-5 h-5" />
                ¡50 puntos de bienvenida agregados!
              </div>
            </div>
            <Link
              href="/auth/login"
              className="block w-full bg-[#FF6B35] hover:bg-[#E55A2B] text-white py-4 font-semibold transition-colors min-h-[56px] flex items-center justify-center"
            >
              Ir a Iniciar Sesión
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#2D2A26] flex items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-display text-2xl text-[#FFF8F0] mb-4">
            <Flame className="w-8 h-8 text-[#FF6B35]" />
            Simmer Down
          </Link>
          <h1 className="text-2xl font-bold text-[#FFF8F0]">Únete a SimmerLovers</h1>
          <p className="text-[#6B6560] mt-2">Crea tu cuenta y obtén 50 puntos de bienvenida</p>
        </div>

        <form onSubmit={handleSignup} className="bg-[#252320] border border-[#3D3936] p-8">
          {error && (
            <div className="mb-6 p-4 bg-[#C73E1D]/10 border border-[#C73E1D]/20 flex items-start gap-3 text-[#C73E1D]">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#B8B0A8] mb-2">
                Nombre Completo *
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6560]" />
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-[#3D3936] border border-[#4A4642] text-[#FFF8F0] placeholder:text-[#6B6560] focus:outline-none focus:border-[#FF6B35] transition min-h-[48px]"
                  placeholder="Tu nombre"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#B8B0A8] mb-2">
                Correo Electrónico *
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6560]" />
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-[#3D3936] border border-[#4A4642] text-[#FFF8F0] placeholder:text-[#6B6560] focus:outline-none focus:border-[#FF6B35] transition min-h-[48px]"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-[#B8B0A8] mb-2">
                Teléfono (opcional)
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6560]" />
                <input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-[#3D3936] border border-[#4A4642] text-[#FFF8F0] placeholder:text-[#6B6560] focus:outline-none focus:border-[#FF6B35] transition min-h-[48px]"
                  placeholder="+503 XXXX-XXXX"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#B8B0A8] mb-2">
                Contraseña *
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6560]" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-12 pr-12 py-3 bg-[#3D3936] border border-[#4A4642] text-[#FFF8F0] placeholder:text-[#6B6560] focus:outline-none focus:border-[#FF6B35] transition min-h-[48px]"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B6560] hover:text-[#B8B0A8] transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password requirements */}
              {formData.password && (
                <div className="mt-2 space-y-1">
                  {passwordRequirements.map((req, i) => (
                    <div key={i} className={`flex items-center gap-2 text-xs ${req.met ? 'text-[#4CAF50]' : 'text-[#6B6560]'}`}>
                      <Check className={`w-3 h-3 ${req.met ? 'opacity-100' : 'opacity-30'}`} />
                      {req.text}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#B8B0A8] mb-2">
                Confirmar Contraseña *
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6560]" />
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-[#3D3936] border border-[#4A4642] text-[#FFF8F0] placeholder:text-[#6B6560] focus:outline-none focus:border-[#FF6B35] transition min-h-[48px]"
                  placeholder="••••••••"
                />
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="mt-1 text-xs text-[#C73E1D]">Las contraseñas no coinciden</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-[#FF6B35] hover:bg-[#E55A2B] disabled:bg-[#3D3936] disabled:text-[#6B6560] text-white py-4 font-semibold transition-colors flex items-center justify-center gap-2 min-h-[56px]"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin" />
                Creando cuenta...
              </>
            ) : (
              'Crear Cuenta'
            )}
          </button>

          <p className="text-xs text-[#6B6560] mt-4 text-center">
            Al crear una cuenta, aceptas nuestros{' '}
            <Link href="/terms" className="text-[#FF6B35] hover:underline">Términos</Link>
            {' '}y{' '}
            <Link href="/privacy" className="text-[#FF6B35] hover:underline">Política de Privacidad</Link>
          </p>
        </form>

        <p className="text-center text-[#6B6560] mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link href="/auth/login" className="text-[#FF6B35] hover:underline font-medium">
            Iniciar Sesión
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
