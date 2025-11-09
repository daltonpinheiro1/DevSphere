
export interface Conversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: string
  conversationId: string
  content: string
  sender: 'user' | 'ai'
  timestamp: string
}
