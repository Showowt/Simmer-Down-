'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Phone, AlertCircle, Eye, EyeOff, Check, Gift } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useI18n, translations } from '@/lib/i18n'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const { t } = useI18n()

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
    { met: formData.password.length >= 8, text: t(translations.auth.passwordReqs.minChars) },
    { met: /[A-Z]/.test(formData.password), text: t(translations.auth.passwordReqs.uppercase) },
    { met: /[0-9]/.test(formData.password), text: t(translations.auth.passwordReqs.number) },
  ]

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError(t(translations.auth.passwordsNoMatch))
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
        setError(t(translations.auth.alreadyRegistered))
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#2D2A26] flex items-center justify-center px-4 pt-28">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <div className="bg-[#252320] border border-[#3D3936] p-8">
            <div className="w-20 h-20 bg-[#4CAF50]/10 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-[#4CAF50]" />
            </div>
            <h1 className="text-2xl font-bold text-[#FFF8F0] mb-4">{t(translations.auth.accountCreated)}</h1>
            <p className="text-[#B8B0A8] mb-6">
              {t(translations.auth.checkEmail)} <strong className="text-[#FFF8F0]">{formData.email}</strong>.
              {' '}{t(translations.auth.checkInbox)}
            </p>
            <div className="bg-[#FF6B35]/10 border border-[#FF6B35]/20 p-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-[#FF6B35] font-medium">
                <Gift className="w-5 h-5" />
                {t(translations.auth.welcomePoints)}
              </div>
            </div>
            <Link
              href="/auth/login"
              className="block w-full bg-[#FF6B35] hover:bg-[#E55A2B] text-white py-4 font-semibold transition-colors min-h-[56px] flex items-center justify-center"
            >
              {t(translations.auth.goToLogin)}
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#2D2A26] flex items-center justify-center px-4 py-28">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <img src="/logos/logo-simmer-light.svg" alt="Simmer Down" className="h-12 w-auto mx-auto" />
          </Link>
          <h1 className="text-2xl font-bold text-[#FFF8F0]">{t(translations.auth.joinSimmerLovers)}</h1>
          <p className="text-[#6B6560] mt-2">{t(translations.auth.signupSubtitle)}</p>
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
                {t(translations.auth.fullName)} *
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
                {t(translations.auth.emailLabel)} *
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
                {t(translations.auth.phoneOptional)}
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
                {t(translations.auth.password)} *
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
                  aria-label={showPassword ? t(translations.auth.hidePassword) : t(translations.auth.showPassword)}
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
                {t(translations.auth.confirmPassword)} *
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
                <p className="mt-1 text-xs text-[#C73E1D]">{t(translations.auth.passwordsNoMatch)}</p>
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
                {t(translations.auth.creating)}
              </>
            ) : (
              t(translations.auth.createAccount)
            )}
          </button>

          <p className="text-xs text-[#6B6560] mt-4 text-center">
            {t(translations.auth.byCreating)}{' '}
            <Link href="/terms" className="text-[#FF6B35] hover:underline">{t(translations.footer.terms)}</Link>
            {' '}{t(translations.auth.and)}{' '}
            <Link href="/privacy" className="text-[#FF6B35] hover:underline">{t(translations.footer.privacy)}</Link>
          </p>
        </form>

        <p className="text-center text-[#6B6560] mt-6">
          {t(translations.auth.alreadyHaveAccount)}{' '}
          <Link href="/auth/login" className="text-[#FF6B35] hover:underline font-medium">
            {t(translations.auth.loginBtn)}
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
