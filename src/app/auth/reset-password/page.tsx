'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, AlertCircle, Flame, Check, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const requirements = [
    { label: 'Al menos 8 caracteres', met: password.length >= 8 },
    { label: 'Una letra mayúscula', met: /[A-Z]/.test(password) },
    { label: 'Un número', met: /\d/.test(password) },
  ]

  const allMet = requirements.every((r) => r.met)
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!allMet) {
      setError('La contraseña no cumple con los requisitos')
      return
    }

    if (!passwordsMatch) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })

      if (error) throw error
      setSuccess(true)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al restablecer contraseña'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4 pt-28">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <div className="bg-[#1A1A1A] border border-white/10 p-8">
            <div className="w-20 h-20 bg-[#4CAF50]/10 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-[#4CAF50]" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">
              Contraseña Actualizada
            </h1>
            <p className="text-white/60 mb-6">
              Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
            </p>
            <Link
              href="/auth/login"
              className="block w-full bg-[#E85D04] hover:bg-[#C2410C] text-white py-4 font-semibold transition-colors min-h-[56px] flex items-center justify-center"
            >
              Iniciar Sesión
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4 pt-28">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-display text-2xl text-white mb-4">
            <Flame className="w-8 h-8 text-[#E85D04]" />
            Simmer Down
          </Link>
          <h1 className="text-2xl font-bold text-white">Nueva Contraseña</h1>
          <p className="text-white/40 mt-2">Ingresa tu nueva contraseña</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#1A1A1A] border border-white/10 p-8 space-y-6">
          {error && (
            <div className="p-4 bg-[#C73E1D]/10 border border-[#C73E1D]/20 flex items-center gap-3 text-[#C73E1D]">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white/60 mb-2">
              Nueva Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-[#E85D04] transition min-h-[48px]"
                placeholder="Tu nueva contraseña"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="mt-3 space-y-1">
              {requirements.map((req) => (
                <p key={req.label} className={`text-xs flex items-center gap-2 ${req.met ? 'text-[#4CAF50]' : 'text-white/40'}`}>
                  <span className={`w-4 h-4 flex items-center justify-center border ${req.met ? 'border-[#4CAF50] bg-[#4CAF50]/20' : 'border-white/10'}`}>
                    {req.met && <Check className="w-3 h-3" />}
                  </span>
                  {req.label}
                </p>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-white/60 mb-2">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 bg-white/10 border text-white placeholder:text-white/40 focus:outline-none transition min-h-[48px] ${
                  confirmPassword.length > 0
                    ? passwordsMatch
                      ? 'border-[#4CAF50]'
                      : 'border-[#C73E1D]'
                    : 'border-white/20 focus:border-[#E85D04]'
                }`}
                placeholder="Repite tu nueva contraseña"
              />
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="text-xs text-[#C73E1D] mt-1">Las contraseñas no coinciden</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !allMet || !passwordsMatch}
            className="w-full bg-[#E85D04] hover:bg-[#C2410C] disabled:bg-white/10 disabled:text-white/40 text-white py-4 font-semibold transition-colors flex items-center justify-center gap-2 min-h-[56px]"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin" />
                Actualizando...
              </>
            ) : (
              'Restablecer Contraseña'
            )}
          </button>
        </form>

        <Link
          href="/auth/login"
          className="flex items-center justify-center gap-2 text-white/40 hover:text-white/60 mt-6 transition-colors"
        >
          Volver a Iniciar Sesión
        </Link>
      </motion.div>
    </div>
  )
}
