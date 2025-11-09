
'use client'

import { useState, useEffect } from 'react'
import { ChatSidebar } from './chat-sidebar'
import { ChatMessages } from './chat-messages'
import { ChatInput } from './chat-input'
import { ChatHeader } from './chat-header'
import { useChat } from '@/hooks/use-chat'
import { motion } from 'framer-motion'

export function ChatInterface() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const {
    conversations,
    currentConversation,
    messages,
    isLoading,
    createNewConversation,
    loadConversation,
    sendMessage,
    loadConversations
  } = useChat()

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  const handleSendMessage = async (content: string) => {
    if (!currentConversation) {
      const newConversation = await createNewConversation('Nova Conversa')
      if (newConversation) {
        await sendMessage(content)
      }
    } else {
      await sendMessage(content)
    }
  }

  const handleNewChat = async () => {
    await createNewConversation('Nova Conversa')
    setIsMobileMenuOpen(false)
  }

  const handleLoadConversation = async (conversationId: string) => {
    await loadConversation(conversationId)
    setIsMobileMenuOpen(false)
  }

  return (
    <div className="flex h-screen w-full">
      {/* Sidebar */}
      <motion.div 
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3 }}
        className={`
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 fixed md:relative z-30 w-80 h-full
          bg-black/40 backdrop-blur-md border-r border-white/10
          transition-transform duration-300
        `}
      >
        <ChatSidebar
          conversations={conversations}
          currentConversationId={currentConversation?.id}
          onNewChat={handleNewChat}
          onSelectConversation={handleLoadConversation}
          onClose={() => setIsMobileMenuOpen(false)}
        />
      </motion.div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <ChatHeader 
          conversationTitle={currentConversation?.title || 'CENTER AI OMNI'}
          onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <ChatMessages 
            messages={messages}
            isLoading={isLoading}
          />
        </div>

        {/* Input */}
        <div className="border-t border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="p-4">
            <ChatInput 
              onSendMessage={handleSendMessage}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  )
}
