'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Shield, X, AlertTriangle } from 'lucide-react'

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

interface PostMessagePayload {
  type: 'pt_result'
  orderId: string
  status: 'paid' | 'failed'
  message?: string
  authorizationCode?: string | null
  sig: string
}

interface ThreeDSecureModalProps {
  /** HTML returned by PowerTranz /spi/sale as RedirectData */
  redirectData: string
  orderId: string
  /** Callback when 3DS flow completes (success or failure) */
  onComplete: (result: {
    status: 'paid' | 'failed'
    message?: string
    authorizationCode?: string | null
  }) => void
  onClose: () => void
}

const TIMEOUT_MS = 300_000 // 5 minutes max for 3DS challenge
const POLL_INTERVAL_MS = 3_000

// ═══════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════

export default function ThreeDSecureModal({
  redirectData,
  orderId,
  onComplete,
  onClose,
}: ThreeDSecureModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const completedRef = useRef(false)
  const [showTimeout, setShowTimeout] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  // Track elapsed time for UX
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(prev => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Handle completion (deduped)
  const handleComplete = useCallback(
    (result: { status: 'paid' | 'failed'; message?: string; authorizationCode?: string | null }) => {
      if (completedRef.current) return
      completedRef.current = true
      onComplete(result)
    },
    [onComplete],
  )

  // Listen for postMessage from the callback breakout page
  useEffect(() => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    const expectedOrigin = new URL(appUrl).origin

    function onMessage(event: MessageEvent) {
      // Only accept messages from our own origin
      if (event.origin !== expectedOrigin) return
      const data = event.data as PostMessagePayload
      if (data?.type !== 'pt_result') return
      if (data.orderId !== orderId) return

      handleComplete({
        status: data.status,
        message: data.message,
        authorizationCode: data.authorizationCode,
      })
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [orderId, handleComplete])

  // Timeout handler
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTimeout(true)
    }, TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [])

  // Fallback polling: if postMessage never arrives, poll /api/payments/status
  useEffect(() => {
    // Start polling after 10 seconds as fallback
    const startDelay = setTimeout(() => {
      const pollInterval = setInterval(async () => {
        if (completedRef.current) {
          clearInterval(pollInterval)
          return
        }
        try {
          const res = await fetch(`/api/payments/status?orderId=${orderId}`)
          if (!res.ok) return
          const data = await res.json()
          if (data.success && data.order) {
            if (data.order.paymentStatus === 'paid') {
              handleComplete({ status: 'paid' })
              clearInterval(pollInterval)
            } else if (data.order.paymentStatus === 'failed') {
              handleComplete({
                status: 'failed',
                message: data.order.errorMessage || 'Pago rechazado',
              })
              clearInterval(pollInterval)
            }
          }
        } catch {
          // Polling failure is non-critical
        }
      }, POLL_INTERVAL_MS)

      return () => clearInterval(pollInterval)
    }, 10_000)

    return () => clearTimeout(startDelay)
  }, [orderId, handleComplete])

  // Write RedirectData HTML into iframe
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe || !redirectData) return

    const handleLoad = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document
        if (doc) {
          doc.open()
          doc.write(redirectData)
          doc.close()
        }
      } catch {
        // Cross-origin: this is expected after 3DS redirect
      }
    }

    // For srcdoc-capable browsers, we can write directly
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document
      if (doc) {
        doc.open()
        doc.write(redirectData)
        doc.close()
      }
    } catch {
      // Fallback: use load event
      iframe.addEventListener('load', handleLoad)
      return () => iframe.removeEventListener('load', handleLoad)
    }
  }, [redirectData])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-[#0A0A0A] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#1A1A1A]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#E85D04]/20 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-[#E85D04]" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">
                Verificacion de Seguridad
              </h3>
              <p className="text-white/40 text-xs">
                3D Secure &middot; FAC / Credomatic
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/30 hover:text-white/60 transition rounded-lg hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading indicator */}
        <div className="px-5 py-2 bg-[#0A0A0A] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-[#E85D04]/30 border-t-[#E85D04] rounded-full animate-spin" />
            <span className="text-xs text-white/40">
              Esperando verificacion del banco...
            </span>
          </div>
          <span className="text-xs text-white/20 tabular-nums">
            {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')}
          </span>
        </div>

        {/* 3DS iframe */}
        <div className="w-full bg-white" style={{ minHeight: 420 }}>
          <iframe
            ref={iframeRef}
            title="3D Secure Verification"
            className="w-full border-0"
            style={{ height: 420, minHeight: 420 }}
            sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-top-navigation"
          />
        </div>

        {/* Timeout warning */}
        {showTimeout && (
          <div className="px-5 py-3 bg-yellow-500/10 border-t border-yellow-500/20 flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
            <p className="text-xs text-yellow-400">
              La verificacion esta tardando mas de lo esperado. Si ya completaste la
              autenticacion, espera un momento o cierra e intenta de nuevo.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-[#1A1A1A]">
          <p className="text-xs text-white/30 text-center">
            No cierres esta ventana hasta que el proceso termine
          </p>
        </div>
      </div>
    </div>
  )
}
