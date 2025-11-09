
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

interface ChatInputProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
}

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSendMessage(message.trim())
      setMessage('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const suggestedPrompts = [
    "Como posso melhorar a produtividade da minha equipe?",
    "Preciso de uma análise de dados da empresa",
    "Como automatizar nossos processos internos?",
    "Quais são as tendências do nosso setor?"
  ]

  return (
    <div className="space-y-4">
      {/* Suggested Prompts */}
      {message === '' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex flex-wrap gap-2"
        >
          {suggestedPrompts.map((prompt, index) => (
            <motion.button
              key={prompt}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setMessage(prompt)}
              className="text-xs px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-gray-300 hover:text-white transition-all duration-300 hover:scale-105"
            >
              <Sparkles className="h-3 w-3 mr-1 inline" />
              {prompt}
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className={`
          relative premium-card transition-all duration-300
          ${isFocused ? 'ring-2 ring-purple-500/50 shadow-lg shadow-purple-500/20' : ''}
        `}>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Digite sua pergunta ou solicitação..."
            disabled={disabled}
            className="
              min-h-[60px] max-h-[200px] w-full bg-transparent border-0 
              text-white placeholder-gray-400 resize-none pr-12
              focus:outline-none focus:ring-0
            "
            rows={1}
          />
          
          <Button
            type="submit"
            size="sm"
            disabled={!message.trim() || disabled}
            className="
              absolute bottom-2 right-2 w-8 h-8 p-0 premium-gradient
              disabled:opacity-50 disabled:cursor-not-allowed
              hover:scale-110 transition-transform duration-200
            "
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Character Counter */}
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 premium-gradient rounded-full animate-pulse" />
            <span>Pressione Enter para enviar, Shift+Enter para nova linha</span>
          </div>
          <span>{message.length}/2000</span>
        </div>
      </form>
    </div>
  )
}
