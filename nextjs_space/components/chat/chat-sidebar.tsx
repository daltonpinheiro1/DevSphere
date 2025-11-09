
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Bot, 
  Plus, 
  MessageSquare, 
  Home, 
  X,
  Calendar,
  Clock 
} from 'lucide-react'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Conversation } from '@/lib/types'

interface ChatSidebarProps {
  conversations: Conversation[]
  currentConversationId?: string
  onNewChat: () => void
  onSelectConversation: (id: string) => void
  onClose: () => void
}

export function ChatSidebar({
  conversations,
  currentConversationId,
  onNewChat,
  onSelectConversation,
  onClose
}: ChatSidebarProps) {
  const [isCreating, setIsCreating] = useState(false)

  const handleNewChat = async () => {
    setIsCreating(true)
    try {
      await onNewChat()
    } finally {
      setIsCreating(false)
    }
  }

  // Group conversations by date
  const groupedConversations = conversations?.reduce((groups, conversation) => {
    const date = new Date(conversation.createdAt)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    let groupKey = ''
    if (date.toDateString() === today.toDateString()) {
      groupKey = 'Hoje'
    } else if (date.toDateString() === yesterday.toDateString()) {
      groupKey = 'Ontem'
    } else {
      groupKey = 'Anteriores'
    }

    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(conversation)
    return groups
  }, {} as Record<string, Conversation[]>) || {}

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="premium-gradient p-2 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="font-display">
              <span className="text-lg font-bold premium-text-gradient">
                CENTER AI
              </span>
            </div>
          </Link>
          
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden text-gray-400 hover:text-white"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* New Chat Button */}
        <Button
          onClick={handleNewChat}
          disabled={isCreating}
          className="premium-button w-full group"
        >
          <Plus className={`h-4 w-4 mr-2 ${isCreating ? 'animate-spin' : 'group-hover:rotate-90 transition-transform duration-300'}`} />
          {isCreating ? 'Criando...' : 'Nova Conversa'}
        </Button>
      </div>

      {/* Navigation */}
      <div className="px-6 py-4 border-b border-white/10">
        <Link href="/">
          <Button variant="ghost" className="w-full justify-start text-gray-400 hover:text-white hover:bg-white/10">
            <Home className="h-4 w-4 mr-3" />
            Página Inicial
          </Button>
        </Link>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1 px-3">
        <div className="py-4 space-y-6">
          {Object.keys(groupedConversations).length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
            >
              <MessageSquare className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">
                Nenhuma conversa ainda
              </p>
              <p className="text-gray-600 text-xs mt-1">
                Inicie uma nova conversa para começar
              </p>
            </motion.div>
          ) : (
            Object.entries(groupedConversations).map(([groupName, groupConversations]) => (
              <div key={groupName}>
                <div className="flex items-center space-x-2 px-3 py-2 mb-3">
                  <Calendar className="h-3 w-3 text-gray-500" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {groupName}
                  </span>
                </div>
                
                <div className="space-y-1">
                  {groupConversations.map((conversation) => (
                    <motion.button
                      key={conversation.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onSelectConversation(conversation.id)}
                      className={`
                        w-full text-left p-3 rounded-xl transition-all duration-300 group
                        ${conversation.id === currentConversationId
                          ? 'premium-gradient text-white shadow-lg'
                          : 'hover:bg-white/5 text-gray-300 hover:text-white'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate text-sm">
                            {conversation.title}
                          </h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <Clock className="h-3 w-3 opacity-60" />
                            <span className="text-xs opacity-60">
                              {formatDistanceToNow(new Date(conversation.createdAt), {
                                addSuffix: true,
                                locale: ptBR
                              })}
                            </span>
                          </div>
                        </div>
                        <MessageSquare className="h-4 w-4 opacity-40 group-hover:opacity-60 transition-opacity duration-300 flex-shrink-0 ml-2" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-6 border-t border-white/10">
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-2">
            Histórico salvo automaticamente
          </p>
          <div className="flex items-center justify-center space-x-1 text-xs text-gray-600">
            <div className="w-2 h-2 premium-gradient rounded-full animate-pulse" />
            <span>Sistema ativo</span>
          </div>
        </div>
      </div>
    </div>
  )
}
