'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Flame, ChevronRight, Mic, MicOff, ShoppingCart, Plus, MapPin, Calendar, UtensilsCrossed } from 'lucide-react'
import { useAnimaStore } from '@/store/anima'
import { useCartStore } from '@/store/cart'
import { useRouter } from 'next/navigation'

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

const quickActions = [
  { label: 'Ver Menú', action: 'menu', icon: UtensilsCrossed },
  { label: 'Mis Pedidos', action: 'orders', icon: ShoppingCart },
  { label: 'Ubicaciones', action: 'locations', icon: MapPin },
  { label: 'Eventos', action: 'events', icon: Calendar },
]

type ChatState = 'collapsed' | 'proactive' | 'expanded'

export default function AnimaChatV2() {
  const router = useRouter()
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

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
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

  // Proactive popup
  useEffect(() => {
    if (!hasSeenWelcome && !isOpen) {
      const timer = setTimeout(() => {
        setShowProactive(true)
        setChatState('proactive')
      }, 8000)
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
        customerName,
        customerPhone: memory.preferredLocation,
        loyaltyTier,
        loyaltyPoints: 0,
        visitCount,
        favoriteItems: memory.favoriteItems,
        dietaryPreferences: memory.dietaryPreferences,
        cartItems: cartItems.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })),
        currentTime: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' })
      }

      const res = await fetch('/api/anima', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, context })
      })

      const data = await res.json()
      return data
    } catch (error) {
      console.error('ANIMA API error:', error)
      return {
        response: 'Disculpa, tuve un pequeño problema. ¿Puedes intentar de nuevo?',
        suggestedItems: [],
        actions: []
      }
    }
  }, [customerName, loyaltyTier, visitCount, memory, cartItems])

  // Initialize greeting from API
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const initGreeting = async () => {
        setIsTyping(true)
        const response = await callAnima('Hola')
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
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    const response = await callAnima(input)

    const animaMessage: Message = {
      id: (Date.now() + 1).toString(),
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
    const actionMessages: Record<string, string> = {
      menu: 'Quiero ver el menú',
      orders: 'Mis pedidos',
      locations: '¿Dónde están ubicados?',
      events: '¿Qué eventos tienen?',
      recommendations: 'Recomiéndame algo',
      view_menu: 'Muéstrame el menú',
      add_to_cart: 'Agrégalo al carrito',
      view_cart: 'Ver mi carrito',
      promos: '¿Qué promociones tienen?',
      checkout: 'Quiero pagar',
      track_order: '¿Dónde está mi pedido?',
      pizzas: 'Muéstrame las pizzas',
      ensaladas: 'Muéstrame las ensaladas',
      bebidas: 'Muéstrame las bebidas',
      postres: 'Muéstrame los postres',
      other_options: 'Muéstrame otras opciones',
      other_categories: '¿Qué más tienen?',
      add_more: 'Quiero agregar más',
      help: '¿Cómo funciona?'
    }

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
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    const response = await callAnima(message)

    const animaMessage: Message = {
      id: (Date.now() + 1).toString(),
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

    const confirmMessage: Message = {
      id: Date.now().toString(),
      role: 'anima',
      content: `¡Listo! ${item.name} agregado a tu carrito. ¿Algo más?`,
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
            className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-[#FF6B35] hover:bg-[#E55A2B] text-white flex items-center justify-center shadow-lg shadow-[#FF6B35]/30 transition-all group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Hablar con ANIMA"
          >
            <span className="absolute inset-0 bg-[#FF6B35] animate-ping opacity-20" />
            <Flame className="w-7 h-7 relative z-10 group-hover:animate-bounce" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#4CAF50] border-2 border-[#2D2A26]" />
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
            className="fixed bottom-6 right-6 z-50 w-80 bg-[#252320] border border-[#3D3936] shadow-2xl"
          >
            <div className="flex items-center justify-between p-4 border-b border-[#3D3936]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FF6B35] flex items-center justify-center animate-pulse">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#FFF8F0] text-sm">ANIMA</h3>
                  <p className="text-xs text-[#4CAF50] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-[#4CAF50] animate-pulse" />
                    En línea
                  </p>
                </div>
              </div>
              <button onClick={dismissProactive} className="p-1.5 text-[#6B6560] hover:text-[#FFF8F0]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-[#FFF8F0] text-sm mb-4">{getProactiveMessage()}</p>
              <div className="flex gap-2">
                <button
                  onClick={openChat}
                  className="flex-1 bg-[#FF6B35] hover:bg-[#E55A2B] text-white py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  Sí, platiquemos
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={dismissProactive}
                  className="px-4 bg-[#3D3936] hover:bg-[#4A4642] text-[#B8B0A8] py-3 text-sm"
                >
                  Ahora no
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
            className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-48px)] h-[650px] max-h-[calc(100vh-100px)] bg-[#1F1D1A] border border-[#3D3936] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#3D3936] bg-[#252320]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FF6B35] flex items-center justify-center">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#FFF8F0]">ANIMA</h3>
                  <p className="text-xs text-[#4CAF50] flex items-center gap-1">
                    <span className="w-2 h-2 bg-[#4CAF50] animate-pulse" />
                    El alma de Simmer Down
                  </p>
                </div>
              </div>
              <button onClick={closeChat} className="p-2 text-[#6B6560] hover:text-[#FFF8F0]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex gap-1 p-2 border-b border-[#3D3936] bg-[#252320] overflow-x-auto">
              {quickActions.map((action) => (
                <button
                  key={action.action}
                  onClick={() => handleQuickAction(action.action)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#3D3936] hover:bg-[#FF6B35] text-[#FFF8F0] text-xs font-medium transition-colors whitespace-nowrap"
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
                      ? 'bg-[#FF6B35] text-white'
                      : 'bg-[#252320] text-[#FFF8F0] border border-[#3D3936]'
                  } p-3 text-sm`}>
                    <p className="whitespace-pre-line">{message.content}</p>

                    {/* Suggested Menu Items */}
                    {message.suggestedItems && message.suggestedItems.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-[#3D3936] space-y-2">
                        {message.suggestedItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-2 bg-[#1F1D1A] border border-[#3D3936]"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-[#FFF8F0] text-sm truncate">{item.name}</p>
                              <p className="text-[#4CAF50] text-xs">${item.price.toFixed(2)}</p>
                            </div>
                            <button
                              onClick={() => handleAddToCart(item)}
                              className="ml-2 p-2 bg-[#FF6B35] hover:bg-[#E55A2B] text-white"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    {message.actions && message.actions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-[#3D3936]">
                        {message.actions.slice(0, 4).map((action) => (
                          <button
                            key={action}
                            onClick={() => handleQuickAction(action)}
                            className="px-2.5 py-1.5 bg-[#3D3936] hover:bg-[#FF6B35] text-[#FFF8F0] text-xs transition-colors capitalize"
                          >
                            {action.replace(/_/g, ' ')}
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
                  <div className="bg-[#252320] border border-[#3D3936] p-3 flex gap-1.5">
                    <span className="w-2 h-2 bg-[#FF6B35] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-[#FF6B35] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-[#FF6B35] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-[#3D3936] bg-[#252320]">
              <form onSubmit={(e) => { e.preventDefault(); handleSend() }} className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] placeholder:text-[#6B6560] focus:outline-none focus:border-[#FF6B35] text-sm"
                />
                {recognitionRef.current && (
                  <button
                    type="button"
                    onClick={toggleVoice}
                    className={`px-3 ${isListening ? 'bg-red-500' : 'bg-[#3D3936]'} hover:bg-[#4A4642] text-white transition-colors`}
                  >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="px-4 bg-[#FF6B35] hover:bg-[#E55A2B] disabled:bg-[#3D3936] disabled:text-[#6B6560] text-white transition-colors"
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
