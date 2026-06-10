'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Flame, ChevronRight, Mic, MicOff, ShoppingCart, Plus, MapPin, Calendar, UtensilsCrossed } from 'lucide-react'
import { useAnimaStore } from '@/store/anima'
import { useCartStore } from '@/store/cart'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
}

interface Message {
  id: string
  role: 'anima' | 'user'
  content: string
  timestamp: Date
  suggestedItems?: MenuItem[]
  actions?: string[]
}

// Bilingual quick actions
const quickActionsI18n = {
  es: [
    { label: 'Ver Menú', action: 'menu', icon: UtensilsCrossed },
    { label: 'Mis Pedidos', action: 'orders', icon: ShoppingCart },
    { label: 'Ubicaciones', action: 'locations', icon: MapPin },
    { label: 'Eventos', action: 'events', icon: Calendar },
  ],
  en: [
    { label: 'View Menu', action: 'menu', icon: UtensilsCrossed },
    { label: 'My Orders', action: 'orders', icon: ShoppingCart },
    { label: 'Locations', action: 'locations', icon: MapPin },
    { label: 'Events', action: 'events', icon: Calendar },
  ],
}

// Bilingual labels for inline action buttons returned by the API
const actionLabels: Record<string, { es: string; en: string }> = {
  menu: { es: 'Ver Menú', en: 'View Menu' },
  view_menu: { es: 'Ver Menú', en: 'View Menu' },
  recommendations: { es: 'Recomendaciones', en: 'Recommendations' },
  locations: { es: 'Ubicaciones', en: 'Locations' },
  events: { es: 'Eventos', en: 'Events' },
  orders: { es: 'Mis Pedidos', en: 'My Orders' },
  promos: { es: 'Promociones', en: 'Promos' },
  order: { es: 'Ordenar', en: 'Order' },
  add_to_cart: { es: 'Agregar', en: 'Add to Cart' },
  view_cart: { es: 'Ver Carrito', en: 'View Cart' },
  checkout: { es: 'Pagar', en: 'Checkout' },
  track_order: { es: 'Rastrear Pedido', en: 'Track Order' },
  help: { es: 'Ayuda', en: 'Help' },
  other_options: { es: 'Otras Opciones', en: 'Other Options' },
  other_categories: { es: 'Más Categorías', en: 'More Categories' },
  more_options: { es: 'Más Opciones', en: 'More Options' },
  add_more: { es: 'Agregar Más', en: 'Add More' },
  clear_cart: { es: 'Vaciar Carrito', en: 'Clear Cart' },
  more_info: { es: 'Más Info', en: 'More Info' },
  new_order: { es: 'Nuevo Pedido', en: 'New Order' },
  confirm_repeat: { es: 'Confirmar', en: 'Confirm' },
  modify: { es: 'Modificar', en: 'Modify' },
  enter_phone: { es: 'Ingresar Teléfono', en: 'Enter Phone' },
  reserve: { es: 'Reservar', en: 'Reserve' },
  directions: { es: 'Direcciones', en: 'Directions' },
  santa_ana: { es: 'Santa Ana', en: 'Santa Ana' },
  coatepeque: { es: 'Coatepeque', en: 'Coatepeque' },
  ensaladas: { es: 'Ensaladas', en: 'Salads' },
  pizzas: { es: 'Pizzas', en: 'Pizzas' },
  bebidas: { es: 'Bebidas', en: 'Drinks' },
  postres: { es: 'Postres', en: 'Desserts' },
}

type ChatState = 'collapsed' | 'proactive' | 'expanded'

export default function AnimaChatV2() {
  const router = useRouter()
  const { locale } = useI18n()
  const {
    isOpen,
    setIsOpen,
    customerName,
    loyaltyTier,
    visitCount,
    hasSeenWelcome,
    setHasSeenWelcome,
    memory
  } = useAnimaStore()

  const quickActions = quickActionsI18n[locale] || quickActionsI18n.es

  const addItem = useCartStore((state) => state.addItem)
  const cartItems = useCartStore((state) => state.items)

  const [chatState, setChatState] = useState<ChatState>('collapsed')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showProactive, setShowProactive] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Speech recognition
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const [hasSpeechRecognition, setHasSpeechRecognition] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      queueMicrotask(() => setHasSpeechRecognition(true))
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'es-ES'

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
        setIsListening(false)
      }

      recognitionRef.current.onerror = () => {
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }
  }, [])

  const toggleVoice = () => {
    if (!recognitionRef.current) return

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  // Proactive popup — delayed 30s to avoid jarring first impression
  useEffect(() => {
    if (!hasSeenWelcome && !isOpen) {
      const timer = setTimeout(() => {
        setShowProactive(true)
        setChatState('proactive')
      }, 30000)
      return () => clearTimeout(timer)
    }
  }, [hasSeenWelcome, isOpen])

  const openChat = useCallback(() => {
    setIsOpen(true)
    setChatState('expanded')
    setShowProactive(false)
    setHasSeenWelcome(true)
  }, [setIsOpen, setHasSeenWelcome])

  const dismissProactive = () => {
    setShowProactive(false)
    setChatState('collapsed')
    setHasSeenWelcome(true)
  }

  // Call ANIMA API - defined early so it can be used in effects
  const callAnima = useCallback(async (userMessage: string) => {
    try {
      const context = {
        customerName: customerName || undefined,
        customerPhone: memory.preferredLocation || undefined,
        loyaltyTier: loyaltyTier || undefined,
        loyaltyPoints: 0,
        visitCount,
        favoriteItems: memory.favoriteItems || [],
        dietaryPreferences: memory.dietaryPreferences || [],
        cartItems: cartItems.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })),
        currentTime: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
        language: locale,
      }

      const res = await fetch('/api/anima', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, context })
      })

      if (!res.ok) {
        console.error('[AnimaChatV2] API returned', res.status)
        const fallback = locale === 'en'
          ? 'Sorry, I had a small issue. Please try again.'
          : 'Disculpa, tuve un pequeño problema. ¿Puedes intentar de nuevo?'
        return {
          response: fallback,
          suggestedItems: [],
          actions: ['menu', 'locations', 'help']
        }
      }

      const data = await res.json()
      return data
    } catch (error) {
      console.error('[AnimaChatV2] ANIMA API error:', error)
      const fallback = locale === 'en'
        ? 'Sorry, I had a small issue. Please try again.'
        : 'Disculpa, tuve un pequeño problema. ¿Puedes intentar de nuevo?'
      return {
        response: fallback,
        suggestedItems: [],
        actions: ['menu', 'locations', 'help']
      }
    }
  }, [customerName, loyaltyTier, visitCount, memory, cartItems, locale])

  // Initialize greeting from API
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const initGreeting = async () => {
        setIsTyping(true)
        const response = await callAnima(locale === 'en' ? 'Hello' : 'Hola')
        setMessages([{
          id: '1',
          role: 'anima',
          content: response.response,
          timestamp: new Date(),
          actions: response.actions || ['menu', 'recommendations', 'locations', 'events']
        }])
        setIsTyping(false)
      }
      initGreeting()
    }
  }, [isOpen, messages.length, callAnima])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    const response = await callAnima(input)

    const animaMessage: Message = {
      id: crypto.randomUUID(),
      role: 'anima',
      content: response.response,
      timestamp: new Date(),
      suggestedItems: response.suggestedItems,
      actions: response.actions
    }

    setMessages(prev => [...prev, animaMessage])
    setIsTyping(false)
  }

  const handleQuickAction = async (action: string) => {
    const actionMessagesI18n: Record<string, { es: string; en: string }> = {
      menu: { es: 'Quiero ver el menú', en: 'I want to see the menu' },
      orders: { es: 'Mis pedidos', en: 'My orders' },
      locations: { es: '¿Dónde están ubicados?', en: 'Where are you located?' },
      events: { es: '¿Qué eventos tienen?', en: 'What events do you have?' },
      recommendations: { es: 'Recomiéndame algo', en: 'Recommend something' },
      view_menu: { es: 'Muéstrame el menú', en: 'Show me the menu' },
      add_to_cart: { es: 'Agrégalo al carrito', en: 'Add it to cart' },
      view_cart: { es: 'Ver mi carrito', en: 'View my cart' },
      promos: { es: '¿Qué promociones tienen?', en: 'What promos do you have?' },
      checkout: { es: 'Quiero pagar', en: 'I want to checkout' },
      track_order: { es: '¿Dónde está mi pedido?', en: 'Where is my order?' },
      pizzas: { es: 'Muéstrame las pizzas', en: 'Show me the pizzas' },
      ensaladas: { es: 'Muéstrame las ensaladas', en: 'Show me the salads' },
      bebidas: { es: 'Muéstrame las bebidas', en: 'Show me the drinks' },
      postres: { es: 'Muéstrame los postres', en: 'Show me the desserts' },
      other_options: { es: 'Muéstrame otras opciones', en: 'Show me other options' },
      other_categories: { es: '¿Qué más tienen?', en: 'What else do you have?' },
      add_more: { es: 'Quiero agregar más', en: 'I want to add more' },
      help: { es: '¿Cómo funciona?', en: 'How does it work?' },
    }

    const actionMessages: Record<string, string> = Object.fromEntries(
      Object.entries(actionMessagesI18n).map(([key, val]) => [key, val[locale] || val.es])
    )

    const message = actionMessages[action] || action
    setInput(message)

    // Special navigation actions
    if (action === 'menu' || action === 'view_menu') {
      router.push('/menu')
      return
    }
    if (action === 'orders') {
      router.push('/orders')
      return
    }
    if (action === 'locations') {
      router.push('/locations')
      return
    }
    if (action === 'events') {
      router.push('/events')
      return
    }
    if (action === 'checkout') {
      router.push('/checkout')
      return
    }
    if (action === 'cart') {
      router.push('/cart')
      return
    }

    // Otherwise, send as message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    const response = await callAnima(message)

    const animaMessage: Message = {
      id: crypto.randomUUID(),
      role: 'anima',
      content: response.response,
      timestamp: new Date(),
      suggestedItems: response.suggestedItems,
      actions: response.actions
    }

    setMessages(prev => [...prev, animaMessage])
    setIsTyping(false)
  }

  const handleAddToCart = (item: MenuItem) => {
    addItem({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      image_url: null,
      category: item.category as 'pizza' | 'sides' | 'drinks' | 'desserts',
      available: true,
      created_at: new Date().toISOString()
    })

    const confirmContent = locale === 'en'
      ? `Done! ${item.name} added to your cart. Anything else?`
      : `¡Listo! ${item.name} agregado a tu carrito. ¿Algo más?`

    const confirmMessage: Message = {
      id: crypto.randomUUID(),
      role: 'anima',
      content: confirmContent,
      timestamp: new Date(),
      actions: ['view_cart', 'recommendations', 'menu']
    }

    setMessages(prev => [...prev, confirmMessage])
  }

  const closeChat = () => {
    setIsOpen(false)
    setChatState('collapsed')
  }

  const getProactiveMessage = () => {
    const hour = new Date().getHours()
    const day = new Date().getDay()

    if (locale === 'en') {
      if (visitCount > 2) return 'Great to see you again! The usual?'
      if (day === 0 || day === 6) return 'Weekend vibes! A pizza to celebrate?'
      if (hour >= 17 && hour <= 21) return 'Pizza for dinner? I can help you choose.'
      return 'Hungry? Let me help you find your perfect pizza.'
    }

    if (visitCount > 2) return '¡Qué bueno verte de nuevo! ¿Lo de siempre?'
    if (day === 0 || day === 6) return '¡Fin de semana! ¿Una pizza para celebrar?'
    if (hour >= 17 && hour <= 21) return '¿Una pizza para la cena? Te ayudo a elegir.'
    return '¿Hambre? Te ayudo a encontrar tu pizza perfecta.'
  }

  return (
    <>
      {/* Collapsed State - Floating Button */}
      <AnimatePresence>
        {!isOpen && chatState === 'collapsed' && !showProactive && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={openChat}
            className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-3 z-50 lg:bottom-6 lg:right-6 w-11 h-11 lg:w-14 lg:h-14 rounded-full bg-[#E85D04] hover:bg-[#C2410C] text-white flex items-center justify-center shadow-md shadow-[#E85D04]/20 transition-all group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Hablar con ANIMA"
          >
            <Flame className="w-5 h-5 lg:w-6 lg:h-6 relative z-10" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 lg:w-3 lg:h-3 bg-[#4CAF50] rounded-full border-2 border-[#0A0A0A]" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Proactive State - Popup */}
      <AnimatePresence>
        {showProactive && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-80 hidden lg:block bg-[#1A1A1A] border border-white/10 shadow-2xl rounded-xl"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#E85D04] flex items-center justify-center animate-pulse">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">ANIMA</h3>
                  <p className="text-xs text-[#4CAF50] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-[#4CAF50] animate-pulse" />
                    {locale === 'en' ? 'Online' : 'En línea'}
                  </p>
                </div>
              </div>
              <button onClick={dismissProactive} className="p-1.5 text-white/40 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-white text-sm mb-4">{getProactiveMessage()}</p>
              <div className="flex gap-2">
                <button
                  onClick={openChat}
                  className="flex-1 bg-[#E85D04] hover:bg-[#C2410C] text-white py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {locale === 'en' ? "Yes, let's chat" : 'Sí, platiquemos'}
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={dismissProactive}
                  className="px-4 bg-white/10 hover:bg-white/20 text-white/60 py-3 text-sm"
                >
                  {locale === 'en' ? 'Not now' : 'Ahora no'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded State - Full Chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed inset-x-0 bottom-0 z-50 w-full h-[calc(100vh-4rem)] rounded-t-2xl lg:rounded-xl lg:inset-auto lg:bottom-6 lg:right-6 lg:w-[400px] lg:max-w-[calc(100vw-48px)] lg:h-[600px] lg:max-h-[calc(100vh-100px)] bg-[#111] border border-white/10 flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#1A1A1A]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#E85D04] flex items-center justify-center">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">ANIMA</h3>
                  <p className="text-xs text-[#4CAF50] flex items-center gap-1">
                    <span className="w-2 h-2 bg-[#4CAF50] animate-pulse" />
                    {locale === 'en' ? 'The Soul of Simmer Down' : 'El alma de Simmer Down'}
                  </p>
                </div>
              </div>
              <button onClick={closeChat} className="p-2 text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex gap-1 p-2 border-b border-white/10 bg-[#1A1A1A] overflow-x-auto">
              {quickActions.map((action) => (
                <button
                  key={action.action}
                  onClick={() => handleQuickAction(action.action)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-[#E85D04] text-white text-xs font-medium transition-colors whitespace-nowrap"
                >
                  <action.icon className="w-3.5 h-3.5" />
                  {action.label}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] ${
                    message.role === 'user'
                      ? 'bg-[#E85D04] text-white'
                      : 'bg-[#1A1A1A] text-white border border-white/10'
                  } p-3 text-sm`}>
                    <p className="whitespace-pre-line">{message.content}</p>

                    {/* Suggested Menu Items */}
                    {message.suggestedItems && message.suggestedItems.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                        {message.suggestedItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-2 bg-[#111] border border-white/10"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-white text-sm truncate">{item.name}</p>
                              <p className="text-[#4CAF50] text-xs">${item.price.toFixed(2)}</p>
                            </div>
                            <button
                              onClick={() => handleAddToCart(item)}
                              className="ml-2 p-2 bg-[#E85D04] hover:bg-[#C2410C] text-white"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    {message.actions && message.actions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-white/10">
                        {message.actions.slice(0, 4).map((action) => (
                          <button
                            key={action}
                            onClick={() => handleQuickAction(action)}
                            className="px-2.5 py-1.5 bg-white/10 hover:bg-[#E85D04] text-white text-xs transition-colors capitalize"
                          >
                            {actionLabels[action]?.[locale] || action.replace(/_/g, ' ')}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="bg-[#1A1A1A] border border-white/10 p-3 flex gap-1.5">
                    <span className="w-2 h-2 bg-[#E85D04] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-[#E85D04] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-[#E85D04] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-[#1A1A1A]">
              <form onSubmit={(e) => { e.preventDefault(); handleSend() }} className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={locale === 'en' ? 'Type a message...' : 'Escribe un mensaje...'}
                  className="flex-1 px-4 py-3 bg-[#111] border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-[#E85D04] text-sm"
                />
                {hasSpeechRecognition && (
                  <button
                    type="button"
                    onClick={toggleVoice}
                    className={`px-3 ${isListening ? 'bg-red-500' : 'bg-white/10'} hover:bg-white/20 text-white transition-colors`}
                  >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="px-4 bg-[#E85D04] hover:bg-[#C2410C] disabled:bg-white/10 disabled:text-white/40 text-white transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
