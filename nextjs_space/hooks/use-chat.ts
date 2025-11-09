
'use client'

import { useState, useCallback } from 'react'
import type { Conversation, Message } from '@/lib/types'

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch('/api/conversations')
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    }
  }, [])

  const createNewConversation = useCallback(async (title: string) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      })

      if (response.ok) {
        const data = await response.json()
        const newConversation = data.conversation
        
        setConversations(prev => [newConversation, ...prev])
        setCurrentConversation(newConversation)
        setMessages([])
        
        return newConversation
      }
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
    return null
  }, [])

  const loadConversation = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`)
      if (response.ok) {
        const data = await response.json()
        setCurrentConversation(data.conversation)
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Failed to load conversation:', error)
    }
  }, [])

  const sendMessage = useCallback(async (content: string) => {
    if (!currentConversation) return

    const userMessage: Message = {
      id: Date.now().toString(),
      conversationId: currentConversation.id,
      content,
      sender: 'user',
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: currentConversation.id,
          message: content
        })
      })

      if (response.ok) {
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let aiContent = ''

        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') {
                  // Final message received
                  const aiMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    conversationId: currentConversation.id,
                    content: aiContent,
                    sender: 'ai',
                    timestamp: new Date().toISOString()
                  }
                  setMessages(prev => [...prev, aiMessage])
                  setIsLoading(false)
                  return
                }

                try {
                  const parsed = JSON.parse(data)
                  if (parsed.choices?.[0]?.delta?.content) {
                    aiContent += parsed.choices[0].delta.content
                    
                    // Update the temporary AI message with accumulated content
                    setMessages(prev => {
                      const newMessages = [...prev]
                      const lastMessage = newMessages[newMessages.length - 1]
                      
                      if (lastMessage?.sender === 'ai' && lastMessage.id === 'temp-ai') {
                        lastMessage.content = aiContent
                      } else {
                        const tempAiMessage: Message = {
                          id: 'temp-ai',
                          conversationId: currentConversation.id,
                          content: aiContent,
                          sender: 'ai',
                          timestamp: new Date().toISOString()
                        }
                        newMessages.push(tempAiMessage)
                      }
                      
                      return newMessages
                    })
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        conversationId: currentConversation.id,
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        sender: 'ai',
        timestamp: new Date().toISOString()
      }])
    } finally {
      setIsLoading(false)
    }
  }, [currentConversation])

  return {
    conversations,
    currentConversation,
    messages,
    isLoading,
    createNewConversation,
    loadConversation,
    sendMessage,
    loadConversations
  }
}
