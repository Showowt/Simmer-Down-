'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Check, ShoppingBag, X } from 'lucide-react'
import { create } from 'zustand'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastStore {
  toasts: Toast[]
  addToast: (message: string, type?: Toast['type']) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, type = 'success') => {
    const id = Math.random().toString(36).slice(2)
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }))
    // Auto remove after 3 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }))
    }, 3000)
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}))

export default function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts)
  const removeToast = useToastStore((state) => state.removeToast)

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            className={`flex items-center gap-3 px-4 py-3 ${
              toast.type === 'success'
                ? 'bg-[#252320] border border-[#4CAF50]/30'
                : toast.type === 'error'
                ? 'bg-[#252320] border border-[#C73E1D]/30'
                : 'bg-[#252320] border border-[#FF6B35]/30'
            }`}
            role="alert"
            aria-live="polite"
          >
            <div
              className={`w-8 h-8 flex items-center justify-center ${
                toast.type === 'success'
                  ? 'bg-[#4CAF50]/20 text-[#4CAF50]'
                  : toast.type === 'error'
                  ? 'bg-[#C73E1D]/20 text-[#C73E1D]'
                  : 'bg-[#FF6B35]/20 text-[#FF6B35]'
              }`}
            >
              {toast.type === 'success' ? (
                <Check className="w-4 h-4" />
              ) : toast.type === 'error' ? (
                <X className="w-4 h-4" />
              ) : (
                <ShoppingBag className="w-4 h-4" />
              )}
            </div>
            <span className="text-[#FFF8F0] text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 text-[#6B6560] hover:text-[#FFF8F0] transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
