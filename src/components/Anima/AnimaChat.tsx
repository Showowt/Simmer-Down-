'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Flame, ChevronRight, Sparkles } from 'lucide-react'
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
    '¡Hola! Soy ANIMA, el alma de Simmer Down. ¿En qué puedo ayudarte hoy?',
    '¡Bienvenido a Simmer Down! Soy ANIMA. ¿Qué se te antoja?',
    '¡Qué gusto verte! Soy ANIMA. ¿Listo para algo delicioso?',
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
  surprise: [
    '¡Me encanta cuando me dejan elegir! Basándome en lo que está saliendo perfecto del horno ahora mismo... te recomiendo The Salvadoreño con nuestra Horchata de la casa. ¡Combinación ganadora!',
    '¿Aventurero, eh? Hoy el chef está inspirado con la Truffle Mushroom. Es una experiencia. ¿Te animas?',
  ],
  help: [
    'Claro que te ayudo. ¿Prefieres algo clásico como nuestra Margherita o algo más atrevido? ¿Tienes alguna preferencia dietética que deba conocer?',
    'Para eso estoy. Cuéntame: ¿buscas algo ligero, algo contundente, o algo para compartir?',
  ],
  default: [
    'Mmm, déjame pensar... ¿Puedes darme más detalles?',
    'Interesante pregunta. ¿Me cuentas más?',
    '¡Buena pregunta! Déjame ayudarte con eso.',
  ],
}

// Proactive prompts based on context
const proactivePrompts = [
  { trigger: 'evening', message: '¿Una pizza para la cena? The Salvadoreño está saliendo perfecto del horno.' },
  { trigger: 'weekend', message: '¡Fin de semana! ¿Reservo tu mesa favorita?' },
  { trigger: 'returning', message: '¡Qué bueno verte de nuevo! ¿Lo de siempre?' },
  { trigger: 'default', message: '¿Hambre? Te ayudo a encontrar tu pizza perfecta.' },
]

function getAnimaResponse(action: string): string {
  const responses = animaResponses[action] || animaResponses.default
  return responses[Math.floor(Math.random() * responses.length)]
}

function getProactivePrompt(visitCount: number): string {
  const hour = new Date().getHours()
  const day = new Date().getDay()

  if (visitCount > 2) {
    return proactivePrompts.find(p => p.trigger === 'returning')?.message || ''
  }
  if (day === 0 || day === 6) {
    return proactivePrompts.find(p => p.trigger === 'weekend')?.message || ''
  }
  if (hour >= 17 && hour <= 21) {
    return proactivePrompts.find(p => p.trigger === 'evening')?.message || ''
  }
  return proactivePrompts.find(p => p.trigger === 'default')?.message || ''
}

type ChatState = 'collapsed' | 'proactive' | 'expanded'

export default function AnimaChat() {
  const { isOpen, setIsOpen, customerName, loyaltyTier, visitCount, hasSeenWelcome, setHasSeenWelcome } = useAnimaStore()
  const [chatState, setChatState] = useState<ChatState>('collapsed')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showProactive, setShowProactive] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Handle proactive popup after delay
  useEffect(() => {
    if (!hasSeenWelcome && !isOpen) {
      const timer = setTimeout(() => {
        setShowProactive(true)
        setChatState('proactive')
      }, 8000) // Show proactive after 8 seconds

      return () => clearTimeout(timer)
    }
  }, [hasSeenWelcome, isOpen])

  // Open chat handler
  const openChat = () => {
    setIsOpen(true)
    setChatState('expanded')
    setShowProactive(false)
    setHasSeenWelcome(true)
  }

  // Dismiss proactive
  const dismissProactive = () => {
    setShowProactive(false)
    setChatState('collapsed')
    setHasSeenWelcome(true)
  }

  // Initialize with greeting when expanded
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = customerName
        ? `¡${customerName}! Qué gusto verte de nuevo. ${loyaltyTier === 'gold' || loyaltyTier === 'platinum' ? 'Como miembro ' + loyaltyTier.charAt(0).toUpperCase() + loyaltyTier.slice(1) + ', tienes acceso a ofertas exclusivas hoy. ' : ''}¿En qué te ayudo?`
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

    const lowerInput = input.toLowerCase()
    let responseType = 'default'

    if (lowerInput.includes('sorprend') || lowerInput.includes('elige') || lowerInput.includes('recomienda')) {
      responseType = 'surprise'
    } else if (lowerInput.includes('ayuda') || lowerInput.includes('ayúda') || lowerInput.includes('no sé')) {
      responseType = 'help'
    } else if (lowerInput.includes('menu') || lowerInput.includes('menú') || lowerInput.includes('pizza') || lowerInput.includes('comer')) {
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

  const closeChat = () => {
    setIsOpen(false)
    setChatState('collapsed')
  }

  return (
    <>
      {/* ANIMA Collapsed State - Floating Flame Button */}
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
            {/* Breathing animation ring */}
            <span className="absolute inset-0 bg-[#FF6B35] animate-ping opacity-20" />
            <Flame className="w-7 h-7 relative z-10 group-hover:animate-bounce" />
            {/* Online indicator */}
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#4CAF50] border-2 border-[#2D2A26]" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ANIMA Proactive State - Popup Suggestion */}
      <AnimatePresence>
        {showProactive && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-80 bg-[#252320] border border-[#3D3936] shadow-2xl"
          >
            {/* Header */}
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
              <button
                onClick={dismissProactive}
                className="p-1.5 text-[#6B6560] hover:text-[#FFF8F0] transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Proactive Message */}
            <div className="p-4">
              <p className="text-[#FFF8F0] text-sm mb-4">
                {getProactivePrompt(visitCount)}
              </p>
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
                  className="px-4 bg-[#3D3936] hover:bg-[#4A4642] text-[#B8B0A8] py-3 text-sm transition-colors"
                >
                  Ahora no
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ANIMA Expanded State - Full Chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] h-[600px] max-h-[calc(100vh-100px)] bg-[#1F1D1A] border border-[#3D3936] flex flex-col shadow-2xl"
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
              <button
                onClick={closeChat}
                className="p-2 text-[#6B6560] hover:text-[#FFF8F0] transition-colors"
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
                        ? 'bg-[#FF6B35] text-white'
                        : 'bg-[#252320] text-[#FFF8F0] border border-[#3D3936]'
                    } p-3 text-sm`}
                  >
                    {message.content}

                    {/* Quick Actions */}
                    {message.actions && (
                      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#3D3936]">
                        {message.actions.map((action) => (
                          <button
                            key={action.action}
                            onClick={() => handleQuickAction(action.action)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#3D3936] hover:bg-[#FF6B35] text-[#FFF8F0] text-xs font-medium transition-colors"
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
                  className="flex-1 px-4 py-3 bg-[#1F1D1A] border border-[#3D3936] text-[#FFF8F0] placeholder:text-[#6B6560] focus:outline-none focus:border-[#FF6B35] text-sm"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="px-4 bg-[#FF6B35] hover:bg-[#E55A2B] disabled:bg-[#3D3936] disabled:text-[#6B6560] text-white transition-colors"
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
