'use client'

import { useState, useCallback, useEffect, useRef, type FormEvent } from 'react'
import { CreditCard, Lock, Eye, EyeOff, ShieldCheck, Pencil } from 'lucide-react'
import type { CardPaymentInput, BillingAddressInput } from '@/lib/powertranz/schemas'
import { trackAddPaymentInfo } from '@/lib/track'

// ═════════════════════════════════════════════════
// Types
// ═════════════════════════════════════════════════

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
  /** Pre-fill the cardholder with the buyer's name (most people pay with their own card). */
  defaultHolder?: string
  /** Shown on the pay button, e.g. "$101.70" → "Pagar $101.70". */
  amountLabel?: string
}

// ═════════════════════════════════════════════════
// Card brand detection
// ═════════════════════════════════════════════════

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

// ═════════════════════════════════════════════════
// PAN formatting (4-4-4-4 for most, 4-6-5 for Amex) + Luhn
// ═════════════════════════════════════════════════

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

/** Luhn checksum — a mistyped digit is caught here instead of at the bank
 *  ("Card number is invalid", ISO 14, seen on a real order 2026-11-23). */
export function luhnValid(digits: string): boolean {
  if (!/^\d+$/.test(digits)) return false
  let sum = 0
  let double = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48
    if (double) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
    double = !double
  }
  return sum % 10 === 0
}

// Same rule as cardHolderSchema (lib/powertranz/schemas): a prefilled buyer
// name the API would refuse is caught here with a Spanish message instead.
const HOLDER_RE = /^[A-Za-zÀ-ÿ\s.'-]+$/

/** The gateway answers in English (ISO 8583 texts); tell the buyer what to do. */
export function friendlyPaymentError(message: string): string {
  const m = message.toLowerCase()
  if (/card number is invalid|invalid card|invalid account|invalid pan/.test(m))
    return 'El número de tarjeta no es válido. Revísalo e intenta de nuevo.'
  if (/insufficient/.test(m)) return 'Fondos insuficientes. Prueba con otra tarjeta.'
  if (/expired/.test(m)) return 'La tarjeta está vencida. Prueba con otra tarjeta.'
  if (/cvv|cvc|security code/.test(m)) return 'El código de seguridad (CVV) no coincide. Revísalo.'
  if (/do not honou?r|declined|not permitted|restricted|pick ?up|lost|stolen/.test(m))
    return 'Tu banco rechazó el pago. Llama a tu banco o prueba con otra tarjeta.'
  if (/3d|authenticat|not enrolled/.test(m))
    return 'No se pudo verificar la tarjeta con tu banco. Intenta de nuevo o usa otra tarjeta.'
  return message
}

type Field = 'pan' | 'exp' | 'cvv' | 'holder' | 'email' | 'line1' | 'city' | 'phone'
const FIELD_ORDER: Field[] = ['pan', 'exp', 'cvv', 'holder', 'email', 'line1', 'city', 'phone']
const FIELD_LABELS: Record<Field, string> = {
  pan: 'número de tarjeta',
  exp: 'vencimiento',
  cvv: 'CVV',
  holder: 'nombre en la tarjeta',
  email: 'correo',
  line1: 'dirección',
  city: 'ciudad',
  phone: 'WhatsApp',
}

// ═════════════════════════════════════════════════
// Final gate: the server's own rules
//
// 2026-11-26: "cesar membreno@gmail.com" (space) and accented emails passed the
// loose check above, then /api/payments/initiate refused them with a generic
// "revisa los campos" before any payment row existed — the buyer saw every
// field looking fine and gave up. Before sending, the payload now runs through
// the exact schemas the server uses (lib/powertranz/schemas), so the form can
// never send what the server will refuse, and the failing field is named.
// ═════════════════════════════════════════════════

const PATH_TO_FIELD: Record<string, Field> = {
  'card.pan': 'pan',
  'card.exp': 'exp',
  'card.cvv': 'cvv',
  'card.holder': 'holder',
  'billing.email': 'email',
  'billing.line1': 'line1',
  'billing.line2': 'line1',
  'billing.city': 'city',
  'billing.phone': 'phone',
}

const GATE_MESSAGES: Record<Field, string> = {
  pan: 'Revisa el número de tarjeta',
  exp: 'Revisa el vencimiento (MM/AA)',
  cvv: 'Revisa el CVV',
  holder: 'Solo letras en el nombre (sin números ni símbolos)',
  email: 'Revisa tu correo: sin espacios ni tildes (ej. nombre@gmail.com)',
  line1: 'Revisa la dirección',
  city: 'Revisa la ciudad (máximo 60 letras)',
  phone: 'Revisa tu número de WhatsApp',
}

const loadServerRules = () => import('@/lib/powertranz/schemas')

async function serverRuleErrors(data: CardFormData): Promise<Partial<Record<Field, string>>> {
  try {
    const { cardPaymentSchema, billingAddressSchema } = await loadServerRules()
    const errors: Partial<Record<Field, string>> = {}
    const checks = [
      ['card', cardPaymentSchema.safeParse(data.card)],
      ['billing', billingAddressSchema.safeParse(data.billing)],
    ] as const
    for (const [prefix, result] of checks) {
      if (result.success) continue
      for (const issue of result.error.issues) {
        const field = PATH_TO_FIELD[`${prefix}.${issue.path.join('.')}`]
        if (field && !errors[field]) errors[field] = GATE_MESSAGES[field]
      }
    }
    return errors
  } catch (error) {
    // Chunk failed to load (flaky mobile data): the server still validates.
    console.error('[CardPaymentForm] server rules unavailable', error)
    return {}
  }
}

// ═════════════════════════════════════════════════
// Component
//
// Shortened 2026-11-24: 7 of 8 ticket buyers in one night reached this form
// and never sent the card (no gateway attempt). Now: holder + WhatsApp come
// prefilled from the previous step, the bank-verification fields are one
// compact block that says WHY they are asked, every validation error scrolls
// into view with a summary, the card number is Luhn-checked before the bank
// sees it, decline messages are in Spanish, and the button shows the amount.
// ═════════════════════════════════════════════════

export default function CardPaymentForm({
  onSubmit,
  loading,
  error,
  defaultBilling,
  defaultHolder,
  amountLabel,
}: CardPaymentFormProps) {
  // Card fields
  const [pan, setPan] = useState('')
  const [cvv, setCvv] = useState('')
  const [exp, setExp] = useState('')
  const [holder, setHolder] = useState(defaultHolder?.trim() || '')
  const [showCvv, setShowCvv] = useState(false)

  // Bank-verification (3-D Secure) fields
  const [line1, setLine1] = useState(defaultBilling?.line1 || '')
  const [city, setCity] = useState(defaultBilling?.city || '')
  const [email, setEmail] = useState(defaultBilling?.email || '')
  const [phone, setPhone] = useState(defaultBilling?.phone || '')
  // A WhatsApp we already know stays folded into one line until "Cambiar".
  const [editPhone, setEditPhone] = useState(!defaultBilling?.phone)

  // Validation
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field, string>>>({})
  const formRef = useRef<HTMLFormElement>(null)
  const checkingRef = useRef(false)

  // Warm the server-rules chunk while the buyer types, so the final gate is instant.
  useEffect(() => {
    void loadServerRules().catch(() => undefined)
  }, [])

  const brand = detectBrand(pan)
  const maxCvv = brand === 'amex' ? 4 : 3

  const clearError = useCallback((field: Field) => {
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }, [])

  const handlePanChange = useCallback((value: string) => {
    setPan(value.replace(/\D/g, '').slice(0, 19))
    clearError('pan')
  }, [clearError])

  const handleExpChange = useCallback((value: string) => {
    setExp(value.replace(/\D/g, '').slice(0, 4))
    clearError('exp')
  }, [clearError])

  const handleCvvChange = useCallback((value: string) => {
    setCvv(value.replace(/\D/g, '').slice(0, 4))
    clearError('cvv')
  }, [clearError])

  const focusField = (field: Field) => {
    if (field === 'phone') setEditPhone(true)
    // After React paints the error state (and the phone input, if folded).
    requestAnimationFrame(() => {
      const el = formRef.current?.querySelector<HTMLElement>(`[data-field="${field}"]`)
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.focus({ preventScroll: true })
    })
  }

  const validate = (): CardFormData | null => {
    const errors: Partial<Record<Field, string>> = {}

    // Card validation
    const panDigits = pan.replace(/\D/g, '')
    if (panDigits.length < 13 || panDigits.length > 19) {
      errors.pan = 'Escribe el número completo de la tarjeta'
    } else if (!luhnValid(panDigits)) {
      errors.pan = 'Revisa el número de tarjeta: tiene un dígito incorrecto'
    }
    if (cvv.length < 3) {
      errors.cvv = brand === 'amex' ? 'CVV de 4 dígitos (al frente de la tarjeta)' : 'CVV de 3 dígitos (al reverso)'
    }
    if (exp.length !== 4) {
      errors.exp = 'Fecha de vencimiento MM/AA'
    } else {
      const mm = parseInt(exp.slice(0, 2), 10)
      const yy = parseInt(exp.slice(2, 4), 10)
      const now = new Date()
      const curYY = now.getFullYear() % 100
      const curMM = now.getMonth() + 1
      if (mm < 1 || mm > 12) errors.exp = 'Mes inválido (01 a 12)'
      else if (yy < curYY || (yy === curYY && mm < curMM)) errors.exp = 'Esta tarjeta ya venció'
    }
    const holderClean = holder.trim()
    if (holderClean.length < 2) {
      errors.holder = 'Escribe el nombre como aparece en la tarjeta'
    } else if (!HOLDER_RE.test(holderClean) || holderClean.length > 50) {
      errors.holder = 'Solo letras en el nombre (sin números ni símbolos)'
    }

    // Bank verification
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email.trim())) errors.email = 'Escribe un correo válido'
    if (line1.trim().length < 3) errors.line1 = 'Escribe tu dirección (calle o colonia)'
    if (city.trim().length < 2) errors.city = 'Escribe tu ciudad'
    const phoneDigits = phone.replace(/\D/g, '')
    if (phoneDigits.length < 7) errors.phone = 'Escribe tu número de WhatsApp'

    const first = FIELD_ORDER.find((f) => errors[f])
    if (first) {
      setFieldErrors(errors)
      focusField(first)
      return null
    }

    // Normalize exp to YYMM for PowerTranz
    const expYYMM = `${exp.slice(2, 4)}${exp.slice(0, 2)}`

    return {
      card: {
        pan: panDigits,
        cvv,
        exp: expYYMM,
        holder: holderClean,
      },
      billing: {
        line1: line1.trim().slice(0, 30),
        line2: line1.trim().length > 30 ? line1.trim().slice(30, 80) : null,
        city: city.trim(),
        state: null,
        postalCode: '',
        countryCode: 'SV',
        email: email.trim(),
        phone: phoneDigits,
      },
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (loading || checkingRef.current) return
    setFieldErrors({})
    const data = validate()
    if (!data) return
    checkingRef.current = true
    const gate = await serverRuleErrors(data)
    checkingRef.current = false
    const first = FIELD_ORDER.find((f) => gate[f])
    if (first) {
      setFieldErrors(gate)
      focusField(first)
      return
    }
    trackAddPaymentInfo()
    onSubmit(data)
  }

  const invalid = FIELD_ORDER.filter((f) => fieldErrors[f])

  const inputClass = (field: Field) =>
    `w-full h-12 px-4 bg-[#0A0A0A] border rounded-xl text-white placeholder:text-white/30 focus:outline-none transition text-sm ${
      fieldErrors[field]
        ? 'border-red-500/60 focus:border-red-500'
        : 'border-white/10 focus:border-[#E85D04]'
    }`

  const fieldError = (field: Field) =>
    fieldErrors[field] ? (
      <p className="text-xs text-red-400 mt-1" data-error-for={field}>
        {fieldErrors[field]}
      </p>
    ) : null

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4" autoComplete="on" noValidate>
      {/* ─── Card ─── */}
      <div className="bg-[#1A1A1A] rounded-xl border border-white/10 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg text-white uppercase tracking-wide">Tarjeta</h3>
          <div className="flex items-center gap-2 text-white/40">
            <Lock className="w-4 h-4" />
            <span className="text-xs">Pago seguro</span>
          </div>
        </div>

        {/* Card Number */}
        <div>
          <label htmlFor="card-pan" className="block text-xs text-white/50 mb-1.5">
            Número de tarjeta
          </label>
          <div className="relative">
            <input
              id="card-pan"
              data-field="pan"
              type="text"
              inputMode="numeric"
              autoComplete="cc-number"
              value={formatPan(pan, brand)}
              onChange={(e) => handlePanChange(e.target.value)}
              placeholder="1234 5678 9012 3456"
              maxLength={brand === 'amex' ? 17 : 19}
              aria-invalid={!!fieldErrors.pan}
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
          {fieldError('pan')}
        </div>

        {/* Expiration + CVV */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="card-exp" className="block text-xs text-white/50 mb-1.5">
              Vencimiento
            </label>
            <input
              id="card-exp"
              data-field="exp"
              type="text"
              inputMode="numeric"
              autoComplete="cc-exp"
              value={formatExp(exp)}
              onChange={(e) => handleExpChange(e.target.value)}
              placeholder="MM/AA"
              maxLength={5}
              aria-invalid={!!fieldErrors.exp}
              className={inputClass('exp')}
              disabled={loading}
            />
            {fieldError('exp')}
          </div>
          <div>
            <label htmlFor="card-cvv" className="block text-xs text-white/50 mb-1.5">
              CVV
            </label>
            <div className="relative">
              <input
                id="card-cvv"
                data-field="cvv"
                type={showCvv ? 'text' : 'password'}
                inputMode="numeric"
                autoComplete="cc-csc"
                value={cvv}
                onChange={(e) => handleCvvChange(e.target.value)}
                placeholder={brand === 'amex' ? '1234' : '123'}
                maxLength={maxCvv}
                aria-invalid={!!fieldErrors.cvv}
                className={inputClass('cvv')}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowCvv(!showCvv)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition"
                tabIndex={-1}
                aria-label={showCvv ? 'Ocultar CVV' : 'Mostrar CVV'}
              >
                {showCvv ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldError('cvv')}
          </div>
        </div>

        {/* Cardholder Name — prefilled with the buyer's name */}
        <div>
          <label htmlFor="card-holder" className="block text-xs text-white/50 mb-1.5">
            Nombre en la tarjeta
          </label>
          <input
            id="card-holder"
            data-field="holder"
            type="text"
            autoComplete="cc-name"
            value={holder}
            onChange={(e) => {
              setHolder(e.target.value)
              clearError('holder')
            }}
            placeholder="Como aparece en la tarjeta"
            aria-invalid={!!fieldErrors.holder}
            className={inputClass('holder')}
            disabled={loading}
          />
          {fieldError('holder')}
        </div>
      </div>

      {/* ─── Bank verification (3-D Secure) ─── */}
      <div className="bg-[#1A1A1A] rounded-xl border border-white/10 p-5 space-y-4">
        <div className="flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-[#25D366] mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-white">Verificación del banco</h3>
            <p className="text-xs text-white/40 mt-0.5">
              Tu banco pide estos datos para aprobar el pago (3-D Secure). No los usamos para publicidad.
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="card-email" className="block text-xs text-white/50 mb-1.5">
            Correo electrónico
          </label>
          <input
            id="card-email"
            data-field="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              clearError('email')
            }}
            placeholder="tu@correo.com"
            aria-invalid={!!fieldErrors.email}
            className={inputClass('email')}
            disabled={loading}
          />
          {fieldError('email')}
        </div>

        <div className="grid grid-cols-5 gap-3">
          <div className="col-span-3">
            <label htmlFor="card-line1" className="block text-xs text-white/50 mb-1.5">
              Dirección
            </label>
            <input
              id="card-line1"
              data-field="line1"
              type="text"
              autoComplete="street-address"
              value={line1}
              onChange={(e) => {
                setLine1(e.target.value)
                clearError('line1')
              }}
              placeholder="Calle, número, colonia"
              aria-invalid={!!fieldErrors.line1}
              className={inputClass('line1')}
              disabled={loading}
            />
            {fieldError('line1')}
          </div>
          <div className="col-span-2">
            <label htmlFor="card-city" className="block text-xs text-white/50 mb-1.5">
              Ciudad
            </label>
            <input
              id="card-city"
              data-field="city"
              type="text"
              autoComplete="address-level2"
              value={city}
              onChange={(e) => {
                setCity(e.target.value)
                clearError('city')
              }}
              placeholder="San Salvador"
              aria-invalid={!!fieldErrors.city}
              className={inputClass('city')}
              disabled={loading}
            />
            {fieldError('city')}
          </div>
        </div>

        {editPhone ? (
          <div>
            <label htmlFor="card-phone" className="block text-xs text-white/50 mb-1.5">
              WhatsApp
            </label>
            <input
              id="card-phone"
              data-field="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value)
                clearError('phone')
              }}
              placeholder="+503 7000-0000"
              aria-invalid={!!fieldErrors.phone}
              className={inputClass('phone')}
              disabled={loading}
            />
            {fieldError('phone')}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 text-sm" data-field="phone-summary">
            <span className="text-white/50 min-w-0 truncate">
              WhatsApp <span className="text-white">{phone}</span>
            </span>
            <button
              type="button"
              onClick={() => setEditPhone(true)}
              className="inline-flex items-center gap-1 text-xs text-[#E85D04] hover:text-[#FF8555] shrink-0"
            >
              <Pencil className="w-3 h-3" /> Cambiar
            </button>
          </div>
        )}
      </div>

      {/* ─── What to fix (mirrors the red fields, which may be off-screen on a phone) ─── */}
      {invalid.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3" role="alert" data-testid="card-form-summary">
          <p className="text-red-400 text-sm">
            Revisa: {invalid.map((f) => FIELD_LABELS[f]).join(', ')}.
          </p>
        </div>
      )}

      {/* ─── Gateway / API error ─── */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4" role="alert" data-testid="card-form-error">
          <p className="text-red-400 text-sm">{friendlyPaymentError(error)}</p>
        </div>
      )}

      {/* ─── Submit (always enabled: a tap with missing data explains what is missing) ─── */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-[#E85D04] hover:bg-[#C2410C] disabled:bg-[#1A1A1A] disabled:text-white/30 text-white font-bold text-lg rounded-xl transition flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Procesando...
          </>
        ) : (
          <>
            <Lock className="w-5 h-5" />
            {amountLabel ? `Pagar ${amountLabel}` : 'Pagar con Tarjeta'}
          </>
        )}
      </button>

      <p className="text-center text-xs text-white/30">
        Pago procesado de forma segura por FAC / Credomatic
      </p>
    </form>
  )
}
