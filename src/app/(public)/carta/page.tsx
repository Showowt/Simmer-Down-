'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Search,
  X,
  ShoppingBag,
  Plus,
  Minus,
  ChevronRight,
} from 'lucide-react'
import { useCartStore, useUIStore, useTranslation } from '@/lib/store'
import { useMenuImageOverrides } from '@/lib/use-menu-image-overrides'
import {
  MENU_CATEGORIES,
  MENU_ITEMS,
  PIZZA_MODIFIERS,
  getItemsByCategory,
  searchMenuItems,
  formatPrice,
  calculateItemTotal,
  type MenuItem,
  type MenuItemSize,
  type MenuItemModifier,
} from '@/lib/data'

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

// ─────────────────────────────────────────────────────────────
// BADGE STRIP
// ─────────────────────────────────────────────────────────────

function ItemBadges({ item }: { item: MenuItem }) {
  return (
    <div className="absolute top-2 left-2 flex flex-wrap gap-1 z-10">
      {item.dineInOnly && (
        <span className="bg-purple-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
          Solo en local
        </span>
      )}
      {item.isFeatured && (
        <span className="bg-amber-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
          Destacado
        </span>
      )}
      {item.isNew && (
        <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
          Nuevo
        </span>
      )}
      {item.isSpicy && <span className="text-xs leading-none">🌶️</span>}
      {item.isVegetarian && <span className="text-xs leading-none">🌱</span>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MENU ITEM CARD
// ─────────────────────────────────────────────────────────────

interface MenuItemCardProps {
  item: MenuItem
  onOpen: (item: MenuItem) => void
}

function MenuItemCard({ item, onOpen }: MenuItemCardProps) {
  const { t } = useTranslation()

  // Compact horizontal card for items without images (beverages, beers, etc.)
  if (!item.image) {
    return (
      <button
        onClick={() => onOpen(item)}
        className="group bg-[#1A1A1A] rounded-xl border border-white/10 hover:border-[#E85D04]/50 transition-all duration-200 text-left w-full p-4 flex items-center gap-4"
        aria-label={`Ver detalles de ${item.nameEs}`}
      >
        {/* Icon circle */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E85D04]/15 to-[#E85D04]/5 border border-[#E85D04]/20 flex items-center justify-center shrink-0 group-hover:from-[#E85D04]/25 group-hover:to-[#E85D04]/10 transition-all">
          <span className="text-lg" aria-hidden="true">
            {item.categoryId === 'hot-drinks' ? '☕' :
             item.categoryId === 'drinks' ? '🍹' :
             item.categoryId === 'local-beers' || item.categoryId === 'imported-beers' ? '🍺' :
             item.categoryId === 'desserts' ? '🍰' :
             item.categoryId === 'pizzas' || item.categoryId === 'specialty-pizzas' ? '🍕' :
             '🍽️'}
          </span>
        </div>

        {/* Name + description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-1.5">
            <p className="font-semibold text-sm text-white leading-snug truncate">{item.nameEs}</p>
            {item.dineInOnly && (
              <span className="bg-purple-600/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none shrink-0 whitespace-nowrap">Solo en local</span>
            )}
            {item.isVegetarian && <span className="text-[10px] shrink-0">🌱</span>}
            {item.isSpicy && <span className="text-[10px] shrink-0">🌶️</span>}
          </div>
          {item.descriptionEs && (
            <p className="text-[11px] text-white/40 mt-0.5 line-clamp-1">{item.descriptionEs}</p>
          )}
        </div>

        {/* Price + add */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[#E85D04] font-bold text-sm">
            {formatPrice(item.basePrice)}
          </span>
          <span className="w-9 h-9 rounded-full bg-[#E85D04] flex items-center justify-center group-hover:bg-[#ff6a1f] transition-colors">
            <Plus className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </span>
        </div>
      </button>
    )
  }

  // Standard image card
  return (
    <button
      onClick={() => onOpen(item)}
      className="group bg-[#1A1A1A] rounded-xl overflow-hidden border border-white/10 hover:border-[#E85D04]/50 transition-all duration-200 text-left w-full flex flex-col"
      aria-label={`Ver detalles de ${item.nameEs}`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] w-full bg-[#111] shrink-0">
        <Image
          src={item.image}
          alt={item.nameEs}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        <ItemBadges item={item} />
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col flex-1">
        <p className="font-semibold text-sm text-white leading-snug">{item.nameEs}</p>
        {item.descriptionEs && (
          <p className="text-xs text-white/50 mt-1 line-clamp-2 flex-1">
            {item.descriptionEs}
          </p>
        )}
        <div className="flex items-center justify-between mt-3">
          <span className="text-[#E85D04] font-bold text-sm">
            {item.sizes ? `Desde ${formatPrice(item.basePrice)}` : formatPrice(item.basePrice)}
          </span>
          <span className="w-10 h-10 rounded-full bg-[#E85D04] flex items-center justify-center shrink-0 group-hover:bg-[#ff6a1f] transition-colors">
            <Plus className="w-4 h-4 text-white" strokeWidth={2.5} />
          </span>
        </div>
      </div>
    </button>
  )
}

// ─────────────────────────────────────────────────────────────
// ITEM DETAIL SHEET
// ─────────────────────────────────────────────────────────────

function ItemDetailSheet() {
  const { t } = useTranslation()
  const { isMenuItemSheetOpen, selectedMenuItem, closeMenuItemSheet } = useUIStore()
  const { addItem, orderType } = useCartStore()

  const [quantity, setQuantity] = useState(1)
  const [selectedSize, setSelectedSize] = useState<MenuItemSize | undefined>(undefined)
  const [selectedModifiers, setSelectedModifiers] = useState<MenuItemModifier[]>([])
  const [notes, setNotes] = useState('')
  const sheetRef = useRef<HTMLDivElement>(null)

  const item = selectedMenuItem

  // Reset state when a new item opens
  useEffect(() => {
    if (item) {
      queueMicrotask(() => {
        setQuantity(1)
        setSelectedSize(item.sizes ? item.sizes[0] : undefined)
        setSelectedModifiers([])
        setNotes('')
      })
    }
  }, [item])

  // Trap scroll on body when open
  useEffect(() => {
    if (isMenuItemSheetOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isMenuItemSheetOpen])

  const toggleModifier = useCallback((mod: MenuItemModifier) => {
    setSelectedModifiers((prev) =>
      prev.some((m) => m.id === mod.id)
        ? prev.filter((m) => m.id !== mod.id)
        : [...prev, mod]
    )
  }, [])

  const total = item
    ? calculateItemTotal(item, quantity, selectedSize, selectedModifiers)
    : 0

  const handleAdd = () => {
    if (!item) return
    addItem(item, quantity, selectedSize, selectedModifiers, notes || undefined)
    closeMenuItemSheet()
  }

  if (!isMenuItemSheetOpen || !item) return null

  const toppingMods = item.modifiers?.filter((m) => m.category === 'topping') ?? []
  const sauceMods = item.modifiers?.filter((m) => m.category === 'sauce') ?? []
  const extraMods = item.modifiers?.filter((m) => m.category === 'extra') ?? []

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={closeMenuItemSheet}
        aria-hidden="true"
      />

      {/* Sheet panel */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-50 bg-[#1A1A1A] rounded-t-3xl max-h-[85vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label={`Personalizar ${item.nameEs}`}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 sticky top-0 bg-[#1A1A1A] z-10">
          <div className="w-12 h-1.5 bg-white/20 rounded-full" />
        </div>

        {/* Close button */}
        <button
          onClick={closeMenuItemSheet}
          className="absolute top-4 right-4 z-20 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        {/* Item image */}
        {item.image && (
          <div className="relative w-full h-48 shrink-0">
            <Image
              src={item.image}
              alt={item.nameEs}
              fill
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent" />
          </div>
        )}

        <div className="px-5 pb-8">
          {/* Header */}
          <div className="mt-4 mb-5">
            <div className="flex flex-wrap gap-1 mb-2">
              {item.isFeatured && (
                <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full">
                  Destacado
                </span>
              )}
              {item.isVegetarian && (
                <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full">
                  🌱 Vegetariano
                </span>
              )}
              {item.isSpicy && (
                <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full">
                  🌶️ Picante
                </span>
              )}
              {item.isGlutenFree && (
                <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full">
                  Sin Gluten
                </span>
              )}
              {item.dineInOnly && (
                <span className="bg-purple-600/20 text-purple-400 text-xs px-2 py-0.5 rounded-full">
                  🍷 Solo en local
                </span>
              )}
            </div>
            <h2 className="font-display text-2xl text-white tracking-wide">{item.nameEs}</h2>
            {item.descriptionEs && (
              <p className="text-white/60 text-sm mt-1 leading-relaxed">{item.descriptionEs}</p>
            )}
            {item.dineInOnly && orderType !== 'dine_in' && (
              <div className="mt-3 p-3 bg-purple-600/10 border border-purple-500/20 rounded-lg">
                <p className="text-purple-300 text-xs">
                  🍷 Este producto solo está disponible para consumo en el local. Cambia tu tipo de pedido a &quot;Comer aquí&quot; para agregarlo.
                </p>
              </div>
            )}
          </div>

          {/* SIZE SELECTOR */}
          {item.sizes && item.sizes.length > 0 && (
            <div className="mb-6">
              <h3 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">
                {t('menu.selectSize')}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {item.sizes.map((size) => {
                  const isSelected = selectedSize?.id === size.id
                  const sizePrice = item.basePrice + size.priceModifier
                  return (
                    <button
                      key={size.id}
                      onClick={() => setSelectedSize(size)}
                      className={`rounded-xl border p-3 text-left transition-all duration-150 ${
                        isSelected
                          ? 'border-[#E85D04] bg-[#E85D04]/10'
                          : 'border-white/10 bg-[#111] hover:border-white/25'
                      }`}
                    >
                      <p className={`text-sm font-semibold ${isSelected ? 'text-[#E85D04]' : 'text-white'}`}>
                        {size.nameEs}
                      </p>
                      <p className="text-xs text-white/50 mt-0.5">{formatPrice(sizePrice)}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* EXTRAS / MODIFIERS */}
          {item.modifiers && item.modifiers.length > 0 && (
            <div className="mb-6">
              <h3 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">
                {t('menu.addExtras')}
              </h3>

              {toppingMods.length > 0 && (
                <ModifierGroup label="Toppings" mods={toppingMods} selected={selectedModifiers} onToggle={toggleModifier} />
              )}
              {sauceMods.length > 0 && (
                <ModifierGroup label="Salsas" mods={sauceMods} selected={selectedModifiers} onToggle={toggleModifier} />
              )}
              {extraMods.length > 0 && (
                <ModifierGroup label="Extras" mods={extraMods} selected={selectedModifiers} onToggle={toggleModifier} />
              )}
            </div>
          )}

          {/* NOTES */}
          <div className="mb-6">
            <h3 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">
              {t('menu.specialNotes')}
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('menu.notesPlaceholder')}
              rows={2}
              className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#E85D04]/50 resize-none transition-colors"
            />
          </div>

          {/* QUANTITY COUNTER */}
          <div className="flex items-center justify-center gap-6 mb-6">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:border-[#E85D04]/60 disabled:opacity-30 transition-colors"
              aria-label="Reducir cantidad"
            >
              <Minus className="w-4 h-4 text-white" />
            </button>
            <span className="text-white font-bold text-xl w-8 text-center" aria-live="polite">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:border-[#E85D04]/60 transition-colors"
              aria-label="Aumentar cantidad"
            >
              <Plus className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* ADD TO CART BUTTON */}
          {item.dineInOnly && orderType !== 'dine_in' ? (
            <div className="w-full bg-purple-600/20 border border-purple-500/30 text-purple-300 font-semibold rounded-xl h-14 flex items-center justify-center px-5 text-sm">
              🍷 Solo disponible para consumo en local
            </div>
          ) : (
            <button
              onClick={handleAdd}
              className="w-full bg-[#E85D04] hover:bg-[#ff6a1f] active:scale-[0.98] text-white font-bold rounded-xl h-14 flex items-center justify-between px-5 transition-all duration-150"
            >
              <span className="text-base">{t('menu.addToCart')}</span>
              <span className="text-base">{formatPrice(total)}</span>
            </button>
          )}
        </div>
      </div>
    </>
  )
}

// Modifier group sub-component
interface ModifierGroupProps {
  label: string
  mods: MenuItemModifier[]
  selected: MenuItemModifier[]
  onToggle: (mod: MenuItemModifier) => void
}

function ModifierGroup({ label, mods, selected, onToggle }: ModifierGroupProps) {
  return (
    <div className="mb-4">
      <p className="text-white/40 text-xs uppercase tracking-widest mb-2">{label}</p>
      <div className="space-y-2">
        {mods.map((mod) => {
          const isChecked = selected.some((m) => m.id === mod.id)
          return (
            <label
              key={mod.id}
              className="flex items-center justify-between py-2 px-3 rounded-lg border border-white/8 hover:border-white/20 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    isChecked ? 'bg-[#E85D04] border-[#E85D04]' : 'border-white/25'
                  }`}
                >
                  {isChecked && (
                    <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-white">{mod.nameEs}</span>
              </div>
              <span className="text-sm text-[#E85D04] font-medium">+{formatPrice(mod.price)}</span>
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onToggle(mod)}
                className="sr-only"
                aria-label={mod.nameEs}
              />
            </label>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// FLOATING CART BAR
// ─────────────────────────────────────────────────────────────

function FloatingCartBar() {
  const { itemCount, total } = useCartStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { queueMicrotask(() => setMounted(true)) }, [])

  if (!mounted || itemCount === 0) return null

  return (
    <Link
      href="/carrito"
      className="fixed left-4 right-4 z-30 bg-[#E85D04] text-white rounded-xl px-4 py-3.5 shadow-2xl flex items-center justify-between hover:bg-[#ff6a1f] active:scale-[0.98] transition-all duration-150 bottom-[calc(5rem+env(safe-area-inset-bottom))] lg:bottom-6"
      aria-label={`Ver carrito — ${itemCount} artículos`}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <ShoppingBag className="w-5 h-5" />
          <span className="absolute -top-2 -right-2 bg-white text-[#E85D04] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
            {itemCount > 9 ? '9+' : itemCount}
          </span>
        </div>
        <span className="font-semibold text-sm">{formatPrice(total)}</span>
      </div>
      <div className="flex items-center gap-1 text-sm font-semibold">
        <span>Ver Carrito</span>
        <ChevronRight className="w-4 h-4" />
      </div>
    </Link>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────

type DietaryFilter = 'vegetarian' | 'spicy' | 'gluten-free'

export default function CartaPage() {
  const { t } = useTranslation()
  const { openMenuItemSheet } = useUIStore()

  // ── Local state ──────────────────────────────────────────
  const imageOverrides = useMenuImageOverrides()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchInput, setSearchInput] = useState('')
  const [activeFilters, setActiveFilters] = useState<Set<DietaryFilter>>(new Set())
  const searchQuery = useDebounce(searchInput, 280)

  // ── Alcohol categories hidden from online ordering ───────
  const ALCOHOL_CATEGORIES = new Set(['local-beers', 'imported-beers'])
  const onlineCategories = useMemo(() => MENU_CATEGORIES.filter((c) => !ALCOHOL_CATEGORIES.has(c.id)), [])

  // ── Derived items ────────────────────────────────────────
  const displayItems = useMemo(() => {
    let base =
      searchQuery.trim().length > 0
        ? searchMenuItems(searchQuery)
        : selectedCategory === 'all'
        ? MENU_ITEMS.filter((i) => i.isAvailable)
        : getItemsByCategory(selectedCategory)

    // Remove alcohol — can only be ordered in person
    base = base.filter((i) => !i.dineInOnly && !ALCOHOL_CATEGORIES.has(i.categoryId))

    // Dietary filters (all must match if multiple active)
    if (activeFilters.has('vegetarian')) base = base.filter((i) => i.isVegetarian)
    if (activeFilters.has('spicy')) base = base.filter((i) => i.isSpicy)
    if (activeFilters.has('gluten-free')) base = base.filter((i) => i.isGlutenFree)

    // Uploaded photo overrides win over static images
    return base.map((i) => (imageOverrides[i.id] ? { ...i, image: imageOverrides[i.id] } : i))
  }, [searchQuery, selectedCategory, activeFilters, imageOverrides])

  // ── Grouped by category (only when not searching) ────────
  const grouped = useMemo(() => {
    const isSearching = searchQuery.trim().length > 0
    const isSingleCategory = selectedCategory !== 'all'

    if (isSearching || isSingleCategory) return null

    const result: Array<{ category: (typeof MENU_CATEGORIES)[number]; items: MenuItem[] }> = []
    for (const cat of onlineCategories) {
      const items = displayItems.filter((i) => i.categoryId === cat.id)
      if (items.length > 0) result.push({ category: cat, items })
    }
    return result
  }, [displayItems, searchQuery, selectedCategory])

  const toggleFilter = (filter: DietaryFilter) => {
    setActiveFilters((prev) => {
      const next = new Set(prev)
      if (next.has(filter)) next.delete(filter)
      else next.add(filter)
      return next
    })
  }

  const handleCategorySelect = (id: string) => {
    setSelectedCategory(id)
    setSearchInput('')
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* ── PAGE HEADER ──────────────────────────────────── */}
      <div className="pt-40 pb-6 px-4 max-w-7xl mx-auto">
        <h1 className="font-display text-4xl md:text-5xl text-white tracking-widest">
          NUESTRO MENÚ
        </h1>
        <p className="text-white/40 text-sm mt-1 font-body">
          {t('menu.subtitle')}
        </p>
      </div>

      {/* ── STICKY CONTROLS ──────────────────────────────── */}
      <div className="sticky top-[108px] z-30 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/6">
        <div className="max-w-7xl mx-auto px-4">

          {/* SEARCH BAR */}
          <div className="py-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t('menu.search')}
                className="w-full h-12 bg-[#1A1A1A] border border-white/10 rounded-xl pl-11 pr-11 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#E85D04]/50 transition-colors"
                aria-label={t('menu.search')}
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* CATEGORY CHIPS */}
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
            <button
              onClick={() => handleCategorySelect('all')}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-150 ${
                selectedCategory === 'all' && searchInput === ''
                  ? 'bg-[#E85D04] text-white border-[#E85D04]'
                  : 'bg-[#1A1A1A] border-white/10 text-white/60 hover:text-white hover:border-white/25'
              }`}
            >
              {t('menu.all')}
            </button>
            {onlineCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-150 flex items-center gap-1.5 ${
                  selectedCategory === cat.id && searchInput === ''
                    ? 'bg-[#E85D04] text-white border-[#E85D04]'
                    : 'bg-[#1A1A1A] border-white/10 text-white/60 hover:text-white hover:border-white/25'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.nameEs}</span>
              </button>
            ))}
          </div>

          {/* DIETARY FILTER CHIPS */}
          <div className="flex gap-2 pb-3">
            {([
              { id: 'vegetarian' as DietaryFilter, label: '🌱 Vegetariano' },
              { id: 'spicy' as DietaryFilter, label: '🌶️ Picante' },
              { id: 'gluten-free' as DietaryFilter, label: 'GF Sin Gluten' },
            ] as const).map((f) => {
              const active = activeFilters.has(f.id)
              return (
                <button
                  key={f.id}
                  onClick={() => toggleFilter(f.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
                    active
                      ? 'ring-2 ring-[#E85D04] border-[#E85D04] bg-[#E85D04]/10 text-white'
                      : 'border-white/10 bg-[#1A1A1A] text-white/50 hover:text-white/80'
                  }`}
                  aria-pressed={active}
                >
                  {f.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── MENU GRID ─────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 pb-40 pt-6">

        {/* Empty state */}
        {displayItems.length === 0 && (
          <div className="text-center py-24">
            <p className="text-white/30 text-lg mb-2">{t('menu.noResults')}</p>
            <button
              onClick={() => {
                setSearchInput('')
                setSelectedCategory('all')
                setActiveFilters(new Set())
              }}
              className="text-[#E85D04] text-sm hover:underline mt-2"
            >
              Ver todo el menú
            </button>
          </div>
        )}

        {/* SEARCH / SINGLE CATEGORY — flat grid */}
        {grouped === null && displayItems.length > 0 && (
          <>
            {searchQuery.trim().length > 0 && (
              <p className="text-white/30 text-xs uppercase tracking-widest mb-5">
                {displayItems.length} resultado{displayItems.length !== 1 ? 's' : ''} para &ldquo;{searchQuery}&rdquo;
              </p>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {displayItems.map((item) => (
                <MenuItemCard key={item.id} item={item} onOpen={openMenuItemSheet} />
              ))}
            </div>
          </>
        )}

        {/* ALL CATEGORIES — grouped sections */}
        {grouped !== null && (
          <div className="space-y-12">
            {grouped.map(({ category, items }) => (
              <section key={category.id} aria-labelledby={`cat-${category.id}`}>
                {/* Category header */}
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-2xl" aria-hidden="true">{category.icon}</span>
                  <h2
                    id={`cat-${category.id}`}
                    className="font-display text-xl md:text-2xl text-white tracking-wider"
                  >
                    {category.nameEs.toUpperCase()}
                  </h2>
                  <span className="text-white/20 text-sm">{items.length}</span>
                  <div className="flex-1 h-px bg-white/6 ml-2" />
                </div>

                {/* Grid — image items in standard grid, no-image items span full width */}
                {(() => {
                  const withImages = items.filter(i => i.image)
                  const withoutImages = items.filter(i => !i.image)
                  return (
                    <>
                      {withImages.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                          {withImages.map((item) => (
                            <MenuItemCard key={item.id} item={item} onOpen={openMenuItemSheet} />
                          ))}
                        </div>
                      )}
                      {withoutImages.length > 0 && (
                        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 ${withImages.length > 0 ? 'mt-4' : ''}`}>
                          {withoutImages.map((item) => (
                            <MenuItemCard key={item.id} item={item} onOpen={openMenuItemSheet} />
                          ))}
                        </div>
                      )}
                    </>
                  )
                })()}
              </section>
            ))}
          </div>
        )}
      </div>

      {/* ── ITEM DETAIL SHEET ─────────────────────────────── */}
      <ItemDetailSheet />

      {/* ── FLOATING CART BAR ─────────────────────────────── */}
      <FloatingCartBar />
    </div>
  )
}
