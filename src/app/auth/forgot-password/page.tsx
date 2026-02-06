'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, AlertCircle, Flame, ArrowLeft, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error
      setSuccess(true)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al enviar correo'
      setError(errorMessage)
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
            <h1 className="text-2xl font-bold text-[#FFF8F0] mb-4">Correo Enviado</h1>
            <p className="text-[#B8B0A8] mb-6">
              Si existe una cuenta con <strong className="text-[#FFF8F0]">{email}</strong>,
              recibirás un enlace para restablecer tu contraseña.
            </p>
            <Link
              href="/auth/login"
              className="block w-full bg-[#3D3936] hover:bg-[#4A4642] text-[#FFF8F0] py-4 font-semibold transition-colors min-h-[56px] flex items-center justify-center"
            >
              Volver a Iniciar Sesión
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#2D2A26] flex items-center justify-center px-4 pt-20">
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
          <h1 className="text-2xl font-bold text-[#FFF8F0]">Recuperar Contraseña</h1>
          <p className="text-[#6B6560] mt-2">Te enviaremos un enlace para restablecer tu contraseña</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#252320] border border-[#3D3936] p-8">
          {error && (
            <div className="mb-6 p-4 bg-[#C73E1D]/10 border border-[#C73E1D]/20 flex items-center gap-3 text-[#C73E1D]">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#B8B0A8] mb-2">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6560]" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-[#3D3936] border border-[#4A4642] text-[#FFF8F0] placeholder:text-[#6B6560] focus:outline-none focus:border-[#FF6B35] transition min-h-[48px]"
                placeholder="tu@email.com"
              />
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
                Enviando...
              </>
            ) : (
              'Enviar Enlace'
            )}
          </button>
        </form>

        <Link
          href="/auth/login"
          className="flex items-center justify-center gap-2 text-[#6B6560] hover:text-[#B8B0A8] mt-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Iniciar Sesión
        </Link>
      </motion.div>
    </div>
  )
}
