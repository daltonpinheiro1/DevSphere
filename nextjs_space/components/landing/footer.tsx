
'use client'

import Link from 'next/link'
import { Bot } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-black/40 backdrop-blur-md border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center space-x-3 mb-4">
              <div className="premium-gradient p-2 rounded-xl">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold premium-text-gradient font-display">
                CENTER AI OMNI
              </span>
            </Link>
            <p className="text-gray-400 max-w-md leading-relaxed">
              Sistema avançado de chatbot AI empresarial com histórico persistente, interface premium e integração completa para revolucionar a comunicação da sua organização.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold text-white mb-4">Navegação</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#features" className="text-gray-400 hover:text-white transition-colors duration-300">
                  Recursos
                </a>
              </li>
              <li>
                <a href="#como-funciona" className="text-gray-400 hover:text-white transition-colors duration-300">
                  Como Funciona
                </a>
              </li>
              <li>
                <a href="#casos-uso" className="text-gray-400 hover:text-white transition-colors duration-300">
                  Casos de Uso
                </a>
              </li>
            </ul>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-white mb-4">Produto</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/chat" className="text-gray-400 hover:text-white transition-colors duration-300">
                  Iniciar Chat
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              © 2025 CENTER AI OMNI. Sistema de IA empresarial premium.
            </p>
            <p className="text-sm text-gray-400 mt-4 md:mt-0">
              Desenvolvido com ❤️ e tecnologia avançada
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
