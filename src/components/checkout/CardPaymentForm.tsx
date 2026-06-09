'use client'

import { useState, useCallback, useRef, type FormEvent } from 'react'
import { CreditCard, Lock, Eye, EyeOff } from 'lucide-react'
import type { CardPaymentInput, BillingAddressInput } from '@/lib/powertranz/schemas'

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export interface CardFormData {
  card: CardPaymentInput
  billing: BillingAddressInput
}

interface CardPaymentFormProps {
  onSubmit: (data: CardFormData) => void
  loading: boolean
  error?: string | null
  /** Pre-fill billing from order data */
  defaultBilling?: Partial<BillingAddressInput>
}

// ═══════════════════════════════════════════════════════════════
// Card brand detection
// ═══════════════════════════════════════════════════════════════

type CardBrand = 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown'

function detectBrand(pan: string): CardBrand {
  const d = pan.replace(/\D/g, '')
  if (!d) return 'unknown'
  if (/^4/.test(d)) return 'visa'
  if (/^(5[1-5]|2[2-7])/.test(d)) return 'mastercard'
  if (/^3[47]/.test(d)) return 'amex'
  if (/^6(?:011|5|4[4-9])/.test(d)) return 'discover'
  return 'unknown'
}

const BRAND_COLORS: Record<CardBrand, string> = {
  visa: '#1A1F71',
  mastercard: '#EB001B',
  amex: '#006FCF',
  discover: '#FF6600',
  unknown: '#666',
}

const BRAND_LABELS: Record<CardBrand, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'Amex',
  discover: 'Discover',
  unknown: '',
}

// ═══════════════════════════════════════════════════════════════
// PAN formatting (4-4-4-4 for most, 4-6-5 for Amex)
// ═══════════════════════════════════════════════════════════════

function formatPan(raw: string, brand: CardBrand): string {
  const d = raw.replace(/\D/g, '')
  if (brand === 'amex') {
    const parts = [d.slice(0, 4), d.slice(4, 10), d.slice(10, 15)]
    return parts.filter(Boolean).join(' ')
  }
  const parts = [d.slice(0, 4), d.slice(4, 8), d.slice(8, 12), d.slice(12, 16)]
  return parts.filter(Boolean).join(' ')
}

function formatExp(raw: string): string {
  const d = raw.replace(/\D/g, '')
  if (d.length <= 2) return d
  return `${d.slice(0, 2)}/${d.slice(2, 4)}`
}

// ═══════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════

export default function CardPaymentForm({
  onSubmit,
  loading,
  error,
  defaultBilling,
}: CardPaymentFormProps) {
  // Card fields
  const [pan, setPan] = useState('')
  const [cvv, setCvv] = useState('')
  const [exp, setExp] = useState('')
  const [holder, setHolder] = useState('')
  const [showCvv, setShowCvv] = useState(false)

  // Billing fields
  const [line1, setLine1] = useState(defaultBilling?.line1 || '')
  const [city, setCity] = useState(defaultBilling?.city || '')
  const [postalCode, setPostalCode] = useState(defaultBilling?.postalCode || '')
  const [email, setEmail] = useState(defaultBilling?.email || '')
  const [phone, setPhone] = useState(defaultBilling?.phone || '')

  // Validation
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const formRef = useRef<HTMLFormElement>(null)

  const brand = detectBrand(pan)
  const maxPan = brand === 'amex' ? 15 : 16
  const maxCvv = brand === 'amex' ? 4 : 3

  const handlePanChange = useCallback((value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 19)
    setPan(digits)
    setFieldErrors(prev => ({ ...prev, pan: '' }))
  }, [])

  const handleExpChange = useCallback((value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4)
    setExp(digits)
    setFieldErrors(prev => ({ ...prev, exp: '' }))
  }, [])

  const handleCvvChange = useCallback((value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4)
    setCvv(digits)
    setFieldErrors(prev => ({ ...prev, cvv: '' }))
  }, [])

  const validate = (): CardFormData | null => {
    const errors: Record<string, string> = {}

    // Card validation
    const panDigits = pan.replace(/\D/g, '')
    if (panDigits.length < 13 || panDigits.length > 19) {
      errors.pan = 'Numero de tarjeta invalido'
    }
    if (cvv.length < 3) {
      errors.cvv = 'CVV invalido'
    }
    if (exp.length !== 4) {
      errors.exp = 'Fecha invalida (MM/AA)'
    } else {
      const mm = parseInt(exp.slice(0, 2), 10)
      const yy = parseInt(exp.slice(2, 4), 10)
      if (mm < 1 || mm > 12) errors.exp = 'Mes invalido'
      const now = new Date()
      const curYY = now.getFullYear() % 100
      const curMM = now.getMonth() + 1
      if (yy < curYY || (yy === curYY && mm < curMM)) {
        errors.exp = 'Tarjeta expirada'
      }
    }
    if (holder.trim().length < 2) {
      errors.holder = 'Nombre del titular requerido'
    }

    // Billing validation
    if (line1.trim().length < 3) errors.line1 = 'Direccion requerida'
    if (city.trim().length < 2) errors.city = 'Ciudad requerida'
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email.trim())) errors.email = 'Correo electronico requerido'
    if (phone.trim().length < 7) errors.phone = 'Telefono requerido'

    if (Object.keys(errors).some(k => errors[k])) {
      setFieldErrors(errors)
      return null
    }

    // Normalize exp to YYMM for PowerTranz
    const expYYMM = `${exp.slice(2, 4)}${exp.slice(0, 2)}`

    return {
      card: {
        pan: panDigits,
        cvv,
        exp: expYYMM,
        holder: holder.trim(),
      },
      billing: {
        line1: line1.trim().slice(0, 30),
        line2: line1.trim().length > 30 ? line1.trim().slice(30, 80) : null,
        city: city.trim(),
        state: null,
        postalCode: '',
        countryCode: 'SV',
        email: email.trim(),
        phone: phone.trim().replace(/\D/g, ''),
      },
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const data = validate()
    if (data) onSubmit(data)
  }

  const inputClass = (field: string) =>
    `w-full h-12 px-4 bg-[#0A0A0A] border rounded-xl text-white placeholder:text-white/30 focus:outline-none transition text-sm ${
      fieldErrors[field]
        ? 'border-red-500/60 focus:border-red-500'
        : 'border-white/10 focus:border-[#E85D04]'
    }`

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5" autoComplete="on">
      {/* ─── Card Details ─── */}
      <div className="bg-[#1A1A1A] rounded-xl border border-white/10 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg text-white uppercase tracking-wide">
            Datos de Tarjeta
          </h3>
          <div className="flex items-center gap-2 text-white/40">
            <Lock className="w-4 h-4" />
            <span className="text-xs">Seguro</span>
          </div>
        </div>

        {/* Card Number */}
        <div>
          <label className="block text-xs text-white/50 mb-1.5">
            Numero de tarjeta
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="cc-number"
              value={formatPan(pan, brand)}
              onChange={(e) => handlePanChange(e.target.value)}
              placeholder="1234 5678 9012 3456"
              maxLength={brand === 'amex' ? 17 : 19}
              className={inputClass('pan')}
              disabled={loading}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {brand !== 'unknown' && (
                <span
                  className="text-xs font-bold px-1.5 py-0.5 rounded"
                  style={{ color: BRAND_COLORS[brand] }}
                >
                  {BRAND_LABELS[brand]}
                </span>
              )}
              <CreditCard className="w-5 h-5 text-white/20" />
            </div>
          </div>
          {fieldErrors.pan && (
            <p className="text-xs text-red-400 mt-1">{fieldErrors.pan}</p>
          )}
        </div>

        {/* Expiration + CVV */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-white/50 mb-1.5">
              Vencimiento
            </label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="cc-exp"
              value={formatExp(exp)}
              onChange={(e) => handleExpChange(e.target.value)}
              placeholder="MM/AA"
              maxLength={5}
              className={inputClass('exp')}
              disabled={loading}
            />
            {fieldErrors.exp && (
              <p className="text-xs text-red-400 mt-1">{fieldErrors.exp}</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">
              CVV
            </label>
            <div className="relative">
              <input
                type={showCvv ? 'text' : 'password'}
                inputMode="numeric"
                autoComplete="cc-csc"
                value={cvv}
                onChange={(e) => handleCvvChange(e.target.value)}
                placeholder={brand === 'amex' ? '1234' : '123'}
                maxLength={maxCvv}
                className={inputClass('cvv')}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowCvv(!showCvv)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition"
                tabIndex={-1}
              >
                {showCvv ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.cvv && (
              <p className="text-xs text-red-400 mt-1">{fieldErrors.cvv}</p>
            )}
          </div>
        </div>

        {/* Cardholder Name */}
        <div>
          <label className="block text-xs text-white/50 mb-1.5">
            Nombre del titular
          </label>
          <input
            type="text"
            autoComplete="cc-name"
            value={holder}
            onChange={(e) => {
              setHolder(e.target.value)
              setFieldErrors(prev => ({ ...prev, holder: '' }))
            }}
            placeholder="Como aparece en la tarjeta"
            className={inputClass('holder')}
            disabled={loading}
          />
          {fieldErrors.holder && (
            <p className="text-xs text-red-400 mt-1">{fieldErrors.holder}</p>
          )}
        </div>
      </div>

      {/* ─── Billing Address ─── */}
      <div className="bg-[#1A1A1A] rounded-xl border border-white/10 p-5 space-y-4">
        <h3 className="font-display text-lg text-white uppercase tracking-wide">
          Direccion de Facturacion
        </h3>

        <div>
          <label className="block text-xs text-white/50 mb-1.5">Direccion</label>
          <input
            type="text"
            autoComplete="street-address"
            value={line1}
            onChange={(e) => {
              setLine1(e.target.value)
              setFieldErrors(prev => ({ ...prev, line1: '' }))
            }}
            placeholder="Calle, numero, colonia"
            className={inputClass('line1')}
            disabled={loading}
          />
          {fieldErrors.line1 && (
            <p className="text-xs text-red-400 mt-1">{fieldErrors.line1}</p>
          )}
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1.5">Ciudad</label>
          <input
            type="text"
            autoComplete="address-level2"
            value={city}
            onChange={(e) => {
              setCity(e.target.value)
              setFieldErrors(prev => ({ ...prev, city: '' }))
            }}
            placeholder="Santa Ana"
            className={inputClass('city')}
            disabled={loading}
          />
          {fieldErrors.city && (
            <p className="text-xs text-red-400 mt-1">{fieldErrors.city}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-white/50 mb-1.5">
              Correo electronico *
            </label>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setFieldErrors(prev => ({ ...prev, email: '' }))
              }}
              placeholder="correo@ejemplo.com"
              className={inputClass('email')}
              disabled={loading}
            />
            {fieldErrors.email && (
              <p className="text-xs text-red-400 mt-1">{fieldErrors.email}</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">
              Telefono *
            </label>
            <input
              type="tel"
              autoComplete="tel"
              required
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value)
                setFieldErrors(prev => ({ ...prev, phone: '' }))
              }}
              placeholder="+503 7000-0000"
              className={inputClass('phone')}
              disabled={loading}
            />
            {fieldErrors.phone && (
              <p className="text-xs text-red-400 mt-1">{fieldErrors.phone}</p>
            )}
          </div>
        </div>
      </div>

      {/* ─── Error Message ─── */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* ─── Submit ─── */}
      <button
        type="submit"
        disabled={loading || pan.length < 13}
        className="w-full py-4 bg-[#E85D04] hover:bg-[#C2410C] disabled:bg-[#1A1A1A] disabled:text-white/30 text-white font-bold text-lg rounded-xl flex items-center justify-center gap-3 transition shadow-lg disabled:shadow-none"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Procesando...
          </>
        ) : (
          <>
            <Lock className="w-5 h-5" />
            Pagar con Tarjeta
          </>
        )}
      </button>

      <p className="text-center text-xs text-white/30">
        Pago procesado de forma segura por FAC / Credomatic
      </p>
    </form>
  )
}
