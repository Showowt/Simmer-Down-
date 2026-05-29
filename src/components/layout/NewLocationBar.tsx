'use client'

import { MapPin, ChevronDown } from 'lucide-react'
import { useCartStore, useUIStore } from '@/lib/store'
import { isLocationOpen } from '@/lib/data'

type OrderType = 'dine_in' | 'takeout' | 'delivery'

interface OrderTypeOption {
  value: OrderType
  labelEs: string
  labelEn: string
  shortEs: string
  shortEn: string
}

const ORDER_TYPE_OPTIONS: OrderTypeOption[] = [
  { value: 'takeout', labelEs: 'Para llevar', labelEn: 'Takeout', shortEs: 'Llevar', shortEn: 'Pickup' },
  { value: 'delivery', labelEs: 'Domicilio', labelEn: 'Delivery', shortEs: 'Envío', shortEn: 'Deliver' },
  { value: 'dine_in', labelEs: 'Comer aquí', labelEn: 'Dine in', shortEs: 'Aquí', shortEn: 'Dine in' },
]

export default function NewLocationBar() {
  const selectedLocation = useCartStore((s) => s.selectedLocation)
  const orderType = useCartStore((s) => s.orderType)
  const setOrderType = useCartStore((s) => s.setOrderType)
  const openLocationSheet = useUIStore((s) => s.openLocationSheet)
  const language = useUIStore((s) => s.language)

  const open = selectedLocation ? isLocationOpen(selectedLocation) : false

  const getLabel = (option: OrderTypeOption) =>
    language === 'es' ? option.labelEs : option.labelEn

  const getShortLabel = (option: OrderTypeOption) =>
    language === 'es' ? option.shortEs : option.shortEn

  return (
    <div className="sticky top-16 z-40 bg-[#1A1A1A] border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 min-h-[44px]">

        {/* Left — Location selector */}
        <button
          onClick={openLocationSheet}
          className="flex items-center gap-2 text-left group min-w-0 shrink py-0.5"
          aria-label={
            selectedLocation
              ? `Ubicación seleccionada: ${selectedLocation.shortName}. Cambiar ubicación`
              : 'Elegir ubicación'
          }
        >
          <MapPin
            className="w-4 h-4 shrink-0 text-[#E85D04]"
            aria-hidden="true"
          />

          {selectedLocation ? (
            <span className="flex items-center gap-2 min-w-0">
              {/* Open/closed status dot */}
              <span
                className={`shrink-0 w-2 h-2 rounded-full ${
                  open
                    ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.7)]'
                    : 'bg-red-500'
                }`}
                aria-label={open ? 'Abierto' : 'Cerrado'}
                role="img"
              />

              <span className="text-[13px] font-semibold text-white truncate max-w-[100px] sm:max-w-[220px]">
                {selectedLocation.shortName}
              </span>

              <span
                className={`hidden sm:inline text-[11px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${
                  open
                    ? 'bg-green-500/15 text-green-400'
                    : 'bg-red-500/15 text-red-400'
                }`}
                aria-hidden="true"
              >
                {open
                  ? language === 'es'
                    ? 'Abierto'
                    : 'Open'
                  : language === 'es'
                  ? 'Cerrado'
                  : 'Closed'}
              </span>
            </span>
          ) : (
            <span className="text-[13px] font-medium text-white/50 group-hover:text-white/80 transition-colors duration-150">
              {language === 'es' ? 'Elegir ubicación' : 'Choose location'}
            </span>
          )}

          <ChevronDown
            className="w-3.5 h-3.5 shrink-0 text-white/40 group-hover:text-white/70 transition-colors duration-150"
            aria-hidden="true"
          />
        </button>

        {/* Right — Order type toggle */}
        <div
          className="flex items-center bg-white/[0.06] rounded-lg p-0.5 shrink-0 overflow-x-auto no-scrollbar"
          role="group"
          aria-label={language === 'es' ? 'Tipo de pedido' : 'Order type'}
        >
          {ORDER_TYPE_OPTIONS.map((option) => {
            const isActive = orderType === option.value
            return (
              <button
                key={option.value}
                onClick={() => setOrderType(option.value)}
                className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-md text-[11px] sm:text-[12px] font-semibold transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'bg-[#E85D04] text-white shadow-sm'
                    : 'text-white/50 hover:text-white/80'
                }`}
                aria-pressed={isActive}
              >
                <span className="sm:hidden">{getShortLabel(option)}</span>
                <span className="hidden sm:inline">{getLabel(option)}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
