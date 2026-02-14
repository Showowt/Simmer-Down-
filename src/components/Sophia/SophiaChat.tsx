'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface SuggestedItem {
  id: string
  name: string
  description: string
  price: number
  pricePersonal?: number
  formattedPrice: string
  category: string
  categoryDisplay: string
  tags: string[]
  bestSeller: boolean
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  suggestedItems?: SuggestedItem[]
  timestamp: Date
}

interface SophiaResponse {
  success: boolean
  intent: string
  message: string
  suggestedItems: SuggestedItem[]
  restaurant: {
    name: string
    tagline: string
    whatsapp: string
  }
}

export default function SophiaChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const callSophia = useCallback(async (userMessage: string): Promise<SophiaResponse | null> => {
    try {
      const response = await fetch('/api/sophia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      })

      if (!response.ok) throw new Error('Sophia API error')
      return await response.json()
    } catch (error) {
      console.error('Sophia error:', error)
      return null
    }
  }, [])

  // Initialize greeting when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const initGreeting = async () => {
        setIsTyping(true)
        const response = await callSophia('Hola')
        setIsTyping(false)

        if (response) {
          setMessages([{
            id: crypto.randomUUID(),
            role: 'assistant',
            content: response.message,
            suggestedItems: response.suggestedItems,
            timestamp: new Date()
          }])
        }
      }
      initGreeting()
    }
  }, [isOpen, messages.length, callSophia])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const handleSend = async () => {
    if (!input.trim() || isTyping) return

    const userMessage = input.trim()
    setInput('')

    // Add user message
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMsg])

    // Get Sophia response
    setIsTyping(true)
    const response = await callSophia(userMessage)
    setIsTyping(false)

    if (response) {
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.message,
        suggestedItems: response.suggestedItems,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMsg])
    } else {
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Lo siento, estoy teniendo problemas. ¿Puedes intentar de nuevo? 🌿',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMsg])
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Voice input
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Tu navegador no soporta reconocimiento de voz')
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'es-ES'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
      setTimeout(() => {
        setInput(transcript)
        handleSend()
      }, 100)
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  const handleQuickAction = async (action: string) => {
    setInput('')

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: action,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMsg])

    setIsTyping(true)
    const response = await callSophia(action)
    setIsTyping(false)

    if (response) {
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.message,
        suggestedItems: response.suggestedItems,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMsg])
    }
  }

  const openWhatsApp = (item?: SuggestedItem) => {
    const phone = '5036990-4674'
    let text = '¡Hola! Me gustaría hacer un pedido.'
    if (item) {
      text = `¡Hola! Me gustaría ordenar: ${item.name} (${item.formattedPrice})`
    }
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg"
        aria-label={isOpen ? 'Cerrar chat' : 'Abrir chat con Sophia'}
      >
        {isOpen ? (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <span className="text-2xl">🌿</span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] h-[600px] bg-white flex flex-col shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-emerald-600 text-white p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 flex items-center justify-center text-xl">
              🌿
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">Sophia</h3>
              <p className="text-emerald-100 text-xs">Simmer Garden • La Majada</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-emerald-200 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] ${
                    message.role === 'user'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-gray-800 border border-gray-200'
                  } p-3`}
                >
                  {/* Message content with markdown-like formatting */}
                  <div className="text-sm whitespace-pre-wrap">
                    {message.content.split('\n').map((line, i) => (
                      <p key={i} className={i > 0 ? 'mt-2' : ''}>
                        {line.startsWith('**') && line.endsWith('**') ? (
                          <strong>{line.slice(2, -2)}</strong>
                        ) : line.includes('**') ? (
                          line.split('**').map((part, j) =>
                            j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                          )
                        ) : (
                          line
                        )}
                      </p>
                    ))}
                  </div>

                  {/* Suggested Items */}
                  {message.suggestedItems && message.suggestedItems.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.suggestedItems.map((item) => (
                        <div
                          key={item.id}
                          className="bg-gray-50 border border-gray-200 p-3 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-gray-900 text-sm">{item.name}</span>
                                {item.bestSeller && (
                                  <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5">⭐ Popular</span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{item.description}</p>
                              {item.tags.length > 0 && (
                                <div className="flex gap-1 mt-1 flex-wrap">
                                  {item.tags.map((tag, i) => (
                                    <span key={i} className="text-xs text-gray-500">{tag}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="font-bold text-emerald-600 text-sm">{item.formattedPrice}</div>
                              <button
                                onClick={() => openWhatsApp(item)}
                                className="mt-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 transition-colors"
                              >
                                Pedir
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 p-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="px-4 py-2 bg-white border-t border-gray-200 flex gap-2 overflow-x-auto">
            <button
              onClick={() => handleQuickAction('¿Qué me recomiendas?')}
              className="flex-shrink-0 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 border border-emerald-200 transition-colors"
            >
              Recomiéndame
            </button>
            <button
              onClick={() => handleQuickAction('pizzas')}
              className="flex-shrink-0 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 border border-emerald-200 transition-colors"
            >
              🍕 Pizzas
            </button>
            <button
              onClick={() => handleQuickAction('platos fuertes')}
              className="flex-shrink-0 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 border border-emerald-200 transition-colors"
            >
              🥩 Platos Fuertes
            </button>
            <button
              onClick={() => handleQuickAction('postres')}
              className="flex-shrink-0 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 border border-emerald-200 transition-colors"
            >
              🍰 Postres
            </button>
            <button
              onClick={() => handleQuickAction('delivery')}
              className="flex-shrink-0 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 border border-emerald-200 transition-colors"
            >
              🛵 Delivery
            </button>
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex gap-2">
              <button
                onClick={startListening}
                disabled={isListening}
                className={`p-3 transition-colors ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
                aria-label="Hablar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu mensaje..."
                className="flex-1 px-4 py-3 border border-gray-300 focus:outline-none focus:border-emerald-500 text-sm"
                disabled={isTyping}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white transition-colors"
                aria-label="Enviar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-center text-xs text-gray-400 mt-2">
              Sophia • Simmer Garden La Majada 🌿
            </p>
          </div>
        </div>
      )}
    </>
  )
}
