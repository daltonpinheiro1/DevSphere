
'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Bot, Menu, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'

interface ChatHeaderProps {
  conversationTitle: string
  onMenuToggle: () => void
}

export function ChatHeader({ conversationTitle, onMenuToggle }: ChatHeaderProps) {
  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20 backdrop-blur-sm"
    >
      {/* Left Side */}
      <div className="flex items-center space-x-4">
        {/* Mobile Menu Toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden text-gray-400 hover:text-white p-2"
          onClick={onMenuToggle}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Back to Home - Mobile */}
        <Link href="/" className="md:hidden">
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>

        {/* Conversation Info */}
        <div className="flex items-center space-x-3">
          <div className="premium-gradient p-2 rounded-xl">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-semibold text-white text-lg">
              {conversationTitle}
            </h1>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Desktop */}
      <div className="hidden md:flex items-center space-x-4">
        <Link href="/">
          <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Início
          </Button>
        </Link>
      </div>
    </motion.header>
  )
}
