'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, RotateCcw, ShoppingBag } from 'lucide-react'

interface PaymentResultProps {
  status: 'paid' | 'failed'
  orderNumber?: string
  orderId?: string
  authorizationCode?: string | null
  message?: string
  onRetry?: () => void
}

export default function PaymentResult({
  status,
  orderNumber,
  orderId,
  authorizationCode,
  message,
  onRetry,
}: PaymentResultProps) {
  if (status === 'paid') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-10 px-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-10 h-10 text-green-400" />
        </motion.div>

        <h2 className="font-display text-3xl text-white uppercase mb-2">
          Pago Exitoso
        </h2>
        <p className="text-white/50 mb-6">
          Tu pedido ha sido confirmado y esta en preparacion
        </p>

        {orderNumber && (
          <div className="inline-block bg-[#1A1A1A] border border-white/10 rounded-xl px-6 py-4 mb-6">
            <p className="text-xs text-white/40 mb-1">Numero de pedido</p>
            <p className="text-2xl font-bold text-[#E85D04] tracking-wider">
              #{orderNumber}
            </p>
            {authorizationCode && (
              <p className="text-xs text-white/30 mt-2">
                Auth: {authorizationCode}
              </p>
            )}
          </div>
        )}

        <div className="space-y-3 max-w-xs mx-auto">
          {orderId && (
            <Link
              href={`/orders?id=${orderId}`}
              className="w-full py-3 bg-[#E85D04] hover:bg-[#C2410C] text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition"
            >
              <ShoppingBag className="w-5 h-5" />
              Ver mi pedido
            </Link>
          )}
          <Link
            href="/carta"
            className="w-full py-3 bg-[#1A1A1A] border border-white/10 hover:border-white/20 text-white/70 hover:text-white font-medium rounded-xl flex items-center justify-center transition"
          >
            Seguir comprando
          </Link>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-10 px-4"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
        className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <XCircle className="w-10 h-10 text-red-400" />
      </motion.div>

      <h2 className="font-display text-3xl text-white uppercase mb-2">
        Pago No Procesado
      </h2>
      <p className="text-white/50 mb-2">
        {message || 'No se pudo completar el pago. Por favor intenta de nuevo.'}
      </p>
      <p className="text-xs text-white/30 mb-6">
        No se realizo ningun cargo a tu tarjeta
      </p>

      <div className="space-y-3 max-w-xs mx-auto">
        {onRetry && (
          <button
            onClick={onRetry}
            className="w-full py-3 bg-[#E85D04] hover:bg-[#C2410C] text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition"
          >
            <RotateCcw className="w-5 h-5" />
            Intentar de nuevo
          </button>
        )}
        <Link
          href="/carrito"
          className="w-full py-3 bg-[#1A1A1A] border border-white/10 hover:border-white/20 text-white/70 hover:text-white font-medium rounded-xl flex items-center justify-center transition"
        >
          Volver al carrito
        </Link>
      </div>
    </motion.div>
  )
}
