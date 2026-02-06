'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Sparkles, Pizza, MapPin, Calendar, Gift } from 'lucide-react'
import { useAnimaStore } from '@/store/anima'

interface Message {
  id: string
  role: 'anima' | 'user'
  content: string
  timestamp: Date
  actions?: AnimaAction[]
}

interface AnimaAction {
  label: string
  action: string
  icon?: string
}

const quickActions: AnimaAction[] = [
  { label: 'Ver Menú', action: 'menu', icon: '🍕' },
  { label: 'Mis Pedidos', action: 'orders', icon: '📦' },
  { label: 'Ubicaciones', action: 'locations', icon: '📍' },
  { label: 'Eventos', action: 'events', icon: '🎉' },
]

// ANIMA personality responses
const animaResponses: Record<string, string[]> = {
  greeting: [
    '¡Hola! Soy Anima, el alma de Simmer Down. ¿En qué puedo ayudarte hoy?',
    '¡Bienvenido a Simmer Down! Soy Anima. ¿Qué se te antoja?',
    '¡Qué gusto verte! Soy Anima. ¿Listo para algo delicioso?',
  ],
  menu: [
    '¡Excelente elección! Nuestro menú tiene pizzas artesanales que te van a encantar. ¿Te llevo al menú o prefieres que te recomiende algo?',
    'El menú está 🔥 hoy. The Salvadoreño está saliendo increíble. ¿Quieres ver las opciones?',
  ],
  orders: [
    'Déjame revisar tus pedidos anteriores... ¿Quieres repetir algo o probar algo nuevo?',
    'Veo que tienes buen gusto. ¿Te preparo lo de siempre?',
  ],
  locations: [
    'Tenemos 5 ubicaciones únicas en El Salvador. Cada una tiene su propia personalidad. ¿Cuál te queda mejor?',
    'Santa Ana es donde todo comenzó, pero Coatepeque tiene la mejor vista del lago. ¿A cuál quieres ir?',
  ],
  events: [
    '¡Siempre hay algo pasando! Desde noches de música en vivo hasta cenas exclusivas. ¿Te cuento qué viene?',
    'Los eventos de Simmer Down son legendarios. ¿Buscas algo específico o te sorprendo?',
  ],
  default: [
    'Mmm, déjame pensar... ¿Puedes darme más detalles?',
    'Interesante pregunta. ¿Me cuentas más?',
    '¡Buena pregunta! Déjame ayudarte con eso.',
  ],
}

function getAnimaResponse(action: string): string {
  const responses = animaResponses[action] || animaResponses.default
  return responses[Math.floor(Math.random() * responses.length)]
}

export default function AnimaChat() {
  const { isOpen, setIsOpen, customerName, loyaltyTier } = useAnimaStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Initialize with greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = customerName
        ? `¡${customerName}! Qué gusto verte de nuevo. ${loyaltyTier === 'gold' ? 'Como miembro Gold, tienes acceso a ofertas exclusivas hoy. ' : ''}¿En qué te ayudo?`
        : getAnimaResponse('greeting')

      setMessages([
        {
          id: '1',
          role: 'anima',
          content: greeting,
          timestamp: new Date(),
          actions: quickActions,
        },
      ])
    }
  }, [isOpen, customerName, loyaltyTier, messages.length])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  const handleQuickAction = (action: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: quickActions.find((a) => a.action === action)?.label || action,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsTyping(true)

    // Simulate ANIMA thinking
    setTimeout(() => {
      const animaMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'anima',
        content: getAnimaResponse(action),
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, animaMessage])
      setIsTyping(false)
    }, 800 + Math.random() * 500)
  }

  const handleSend = () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // Detect intent and respond
    const lowerInput = input.toLowerCase()
    let responseType = 'default'

    if (lowerInput.includes('menu') || lowerInput.includes('pizza') || lowerInput.includes('comer')) {
      responseType = 'menu'
    } else if (lowerInput.includes('pedido') || lowerInput.includes('orden')) {
      responseType = 'orders'
    } else if (lowerInput.includes('ubicacion') || lowerInput.includes('donde') || lowerInput.includes('direccion')) {
      responseType = 'locations'
    } else if (lowerInput.includes('evento') || lowerInput.includes('musica') || lowerInput.includes('fiesta')) {
      responseType = 'events'
    }

    setTimeout(() => {
      const animaMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'anima',
        content: getAnimaResponse(responseType),
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, animaMessage])
      setIsTyping(false)
    }, 1000 + Math.random() * 800)
  }

  return (
    <>
      {/* ANIMA Floating Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/25 transition-all ${isOpen ? 'scale-0' : 'scale-100'}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Abrir chat con Anima"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-zinc-950 animate-pulse" />
      </motion.button>

      {/* ANIMA Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] h-[600px] max-h-[calc(100vh-100px)] bg-zinc-900 border border-zinc-800 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Anima</h3>
                  <p className="text-xs text-green-400 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 animate-pulse" />
                    En línea
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-zinc-400 hover:text-white transition-colors"
                aria-label="Cerrar chat"
              >
                <X className="w-5 h-5" />
              </button>
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
                  <div
                    className={`max-w-[85%] ${
                      message.role === 'user'
                        ? 'bg-orange-500 text-white'
                        : 'bg-zinc-800 text-zinc-100'
                    } p-3 text-sm`}
                  >
                    {message.content}

                    {/* Quick Actions */}
                    {message.actions && (
                      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-zinc-700">
                        {message.actions.map((action) => (
                          <button
                            key={action.action}
                            onClick={() => handleQuickAction(action.action)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-xs font-medium transition-colors"
                          >
                            {action.icon} {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-zinc-800 p-3 flex gap-1">
                    <span className="w-2 h-2 bg-zinc-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-zinc-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-zinc-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-zinc-800">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSend()
                }}
                className="flex gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 text-sm"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="px-4 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-700 text-white transition-colors"
                  aria-label="Enviar mensaje"
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
