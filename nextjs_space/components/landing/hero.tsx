
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowRight, Bot, Sparkles } from 'lucide-react'

export function Hero() {
  const [typedText, setTypedText] = useState('')
  const fullText = 'Revolucione sua comunicação empresarial com inteligência artificial'

  useEffect(() => {
    let i = 0
    const timer = setInterval(() => {
      if (i < fullText.length) {
        setTypedText(fullText.slice(0, i + 1))
        i++
      } else {
        clearInterval(timer)
      }
    }, 50)

    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://cdn.abacus.ai/images/54f163ea-d4c4-4c34-8fd1-e3810b63e5e8.jpg"
          alt="AI Technology Background"
          fill
          className="object-cover opacity-40"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-blue-900/70 to-purple-900/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-8"
        >
          {/* Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-3 text-sm font-medium text-white/90"
          >
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span>Tecnologia de IA Avançada</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="font-display text-5xl md:text-7xl font-bold text-white leading-tight"
          >
            <span className="premium-text-gradient">CENTER AI</span>
            <br />
            <span className="text-white">OMNI</span>
          </motion.h1>

          {/* Animated Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed min-h-[3rem]"
          >
            {typedText}
            <span className="animate-pulse">|</span>
          </motion.p>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="text-lg text-gray-400 max-w-2xl mx-auto"
          >
            Sistema empresarial de chatbot IA com histórico persistente, interface premium e integração completa para transformar a experiência de comunicação da sua organização.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8"
          >
            <Link href="/chat">
              <Button className="premium-button text-lg px-8 py-4 group">
                <Bot className="h-5 w-5 mr-2 group-hover:animate-bounce" />
                Começar Conversa
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            
            <Button
              variant="outline"
              className="text-lg px-8 py-4 bg-white/10 border-white/30 text-white hover:bg-white/20 transition-all duration-300"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Conheça os Recursos
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4 }}
            className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-16 border-t border-white/10"
          >
            <div className="text-center">
              <div className="text-3xl font-bold premium-text-gradient animated-counter">24/7</div>
              <div className="text-sm text-gray-400">Disponibilidade</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold premium-text-gradient animated-counter">99%</div>
              <div className="text-sm text-gray-400">Precisão</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold premium-text-gradient animated-counter">∞</div>
              <div className="text-sm text-gray-400">Conversas</div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/4 left-1/4 w-16 h-16 premium-gradient rounded-full opacity-20 blur-xl"
        />
        <motion.div
          animate={{
            y: [0, 20, 0],
            rotate: [0, -5, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute bottom-1/4 right-1/4 w-20 h-20 premium-gradient rounded-full opacity-20 blur-xl"
        />
      </div>
    </section>
  )
}
