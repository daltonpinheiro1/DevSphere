
'use client'

import { useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bot, User, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Message } from '@/lib/types'

interface ChatMessagesProps {
  messages: Message[]
  isLoading: boolean
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto"
        >
          <div className="premium-gradient w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 pulse-glow">
            <Bot className="h-10 w-10 text-white" />
          </div>
          <h3 className="font-display text-2xl font-semibold text-white mb-4">
            Bem-vindo ao <span className="premium-text-gradient">DevSphere.ai</span>
          </h3>
          <p className="text-gray-400 leading-relaxed">
            Sou sua assistente de IA empresarial. Posso ajudar com consultas, análises, suporte e muito mais. Como posso ajudá-lo hoje?
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1" ref={scrollAreaRef}>
      <div className="p-4 space-y-6 max-w-4xl mx-auto">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`flex gap-4 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.sender === 'ai' && (
                <div className="premium-gradient w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="h-5 w-5 text-white" />
                </div>
              )}

              <div className={`flex flex-col space-y-2 max-w-[80%] ${message.sender === 'user' ? 'items-end' : 'items-start'}`}>
                {/* Message Bubble */}
                <div className={message.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                  <div className="whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                </div>

                {/* Timestamp */}
                <div className={`text-xs text-gray-500 px-2 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  {format(new Date(message.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </div>
              </div>

              {message.sender === 'user' && (
                <div className="bg-white/10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-white" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading Indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex gap-4 justify-start"
          >
            <div className="premium-gradient w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="chat-bubble-ai">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                <span className="text-sm opacity-75">Processando sua solicitação...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  )
}
