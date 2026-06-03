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
            <h1 className="text-2xl font-bold text-white mb-4">Correo Enviado</h1>
            <p className="text-white/60 mb-6">
              Si existe una cuenta con <strong className="text-white">{email}</strong>,
              recibirás un enlace para restablecer tu contraseña.
            </p>
            <Link
              href="/auth/login"
              className="block w-full bg-white/10 hover:bg-white/20 text-white py-4 font-semibold transition-colors min-h-[56px] flex items-center justify-center"
            >
              Volver a Iniciar Sesión
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
          <h1 className="text-2xl font-bold text-white">Recuperar Contraseña</h1>
          <p className="text-white/40 mt-2">Te enviaremos un enlace para restablecer tu contraseña</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#1A1A1A] border border-white/10 p-8">
          {error && (
            <div className="mb-6 p-4 bg-[#C73E1D]/10 border border-[#C73E1D]/20 flex items-center gap-3 text-[#C73E1D]">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white/60 mb-2">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-[#E85D04] transition min-h-[48px]"
                placeholder="tu@email.com"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-[#E85D04] hover:bg-[#C2410C] disabled:bg-white/10 disabled:text-white/40 text-white py-4 font-semibold transition-colors flex items-center justify-center gap-2 min-h-[56px]"
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
          className="flex items-center justify-center gap-2 text-white/40 hover:text-white/60 mt-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Iniciar Sesión
        </Link>
      </motion.div>
    </div>
  )
}
