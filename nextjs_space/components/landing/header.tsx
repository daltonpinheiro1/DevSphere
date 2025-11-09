
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Bot, Menu, X } from 'lucide-react'
import { motion } from 'framer-motion'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-md border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="premium-gradient p-2 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div className="font-display">
              <span className="text-xl font-bold premium-text-gradient">
                CENTER AI OMNI
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors duration-300">
              Recursos
            </a>
            <a href="#como-funciona" className="text-gray-300 hover:text-white transition-colors duration-300">
              Como Funciona
            </a>
            <a href="#casos-uso" className="text-gray-300 hover:text-white transition-colors duration-300">
              Casos de Uso
            </a>
            <Link href="/whatsapp-admin">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                WhatsApp Admin
              </Button>
            </Link>
            <Link href="/chat">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
                Chat Centermed
              </Button>
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-300 hover:text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden py-4 border-t border-white/10"
          >
            <div className="flex flex-col space-y-4">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors duration-300">
                Recursos
              </a>
              <a href="#como-funciona" className="text-gray-300 hover:text-white transition-colors duration-300">
                Como Funciona
              </a>
              <a href="#casos-uso" className="text-gray-300 hover:text-white transition-colors duration-300">
                Casos de Uso
              </a>
              <Link href="/whatsapp-admin">
                <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                  WhatsApp Admin
                </Button>
              </Link>
              <Link href="/chat">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg w-full">
                  Chat Centermed
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </motion.header>
  )
}
