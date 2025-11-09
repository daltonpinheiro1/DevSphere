
'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Bot, History, Plug, Shield } from 'lucide-react'

const features = [
  {
    icon: Bot,
    title: 'IA Conversacional Avançada',
    description: 'Chatbot inteligente com capacidade de compreender contexto, manter conversas naturais e fornecer respostas precisas e relevantes.',
    image: 'https://cdn.abacus.ai/images/c8d3e29e-11c9-4d21-a144-20952ddc161a.jpg'
  },
  {
    icon: History,
    title: 'Histórico Persistente',
    description: 'Todas as conversas são automaticamente salvas e organizadas, permitindo continuidade e análise de interações anteriores.',
    image: 'https://cdn.abacus.ai/images/9ef2c850-658e-4c8e-9d5e-df433f78f2cd.jpg'
  },
  {
    icon: Plug,
    title: 'Integração Empresarial',
    description: 'Conecta-se facilmente com sistemas existentes, APIs e fluxos de trabalho da sua organização para máxima eficiência.',
    image: 'https://cdn.abacus.ai/images/8468715f-41ae-486a-87c6-9548c8b2bc4e.jpg'
  },
  {
    icon: Shield,
    title: 'Segurança Premium',
    description: 'Criptografia de ponta a ponta, conformidade com LGPD e proteção avançada de dados empresariais sensíveis.',
    image: 'https://cdn.abacus.ai/images/a52683ae-2bb9-49a3-ab96-a3b3aaf384a9.jpg'
  }
]

export function Features() {
  return (
    <section id="features" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-6">
            Recursos <span className="premium-text-gradient">Premium</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Descubra as funcionalidades avançadas que tornam o CENTER AI OMNI a escolha ideal para sua empresa.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="premium-card p-8 group hover:scale-[1.02] transition-all duration-500"
            >
              <div className="flex flex-col space-y-6">
                {/* Icon and Image */}
                <div className="flex items-center justify-between">
                  <div className="premium-gradient p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden">
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h3 className="font-display text-xl font-semibold text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>

              {/* Hover Effect Border */}
              <div className="absolute inset-0 rounded-2xl border border-transparent group-hover:border-purple-500/50 transition-all duration-500" />
            </motion.div>
          ))}
        </div>

        {/* Background Decoration */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-40 h-40 premium-gradient rounded-full opacity-10 blur-3xl" />
          <div className="absolute bottom-1/4 -right-20 w-32 h-32 premium-gradient rounded-full opacity-10 blur-3xl" />
        </div>
      </div>
    </section>
  )
}
