
'use client'

import { motion } from 'framer-motion'
import { MessageSquare, Brain, Database, Sparkles } from 'lucide-react'

const steps = [
  {
    icon: MessageSquare,
    title: 'Inicie a Conversa',
    description: 'Digite sua pergunta ou solicitação na interface intuitiva do chat.',
    step: '01'
  },
  {
    icon: Brain,
    title: 'IA Processa',
    description: 'Nossa IA avançada analisa o contexto e processa sua solicitação.',
    step: '02'
  },
  {
    icon: Sparkles,
    title: 'Resposta Inteligente',
    description: 'Receba uma resposta personalizada, precisa e contextualmente relevante.',
    step: '03'
  },
  {
    icon: Database,
    title: 'Histórico Salvo',
    description: 'Toda conversa é automaticamente salva para futura referência.',
    step: '04'
  }
]

export function HowItWorks() {
  return (
    <section id="como-funciona" className="py-24 relative overflow-hidden">
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
            Como <span className="premium-text-gradient">Funciona</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Processo simples e eficiente para obter respostas inteligentes em tempo real.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 premium-gradient opacity-30 transform -translate-y-1/2" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="relative text-center group"
              >
                {/* Step Number */}
                <div className="absolute -top-4 -left-4 text-6xl font-bold text-purple-900/20 font-display">
                  {step.step}
                </div>

                {/* Card */}
                <div className="premium-card p-8 h-full hover:scale-105 transition-all duration-500 relative z-10">
                  {/* Icon */}
                  <div className="premium-gradient w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 pulse-glow">
                    <step.icon className="h-8 w-8 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="font-display text-xl font-semibold text-white mb-4">
                    {step.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Arrow for larger screens */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-20">
                    <div className="w-8 h-8 premium-gradient rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="premium-card p-8 max-w-2xl mx-auto">
            <h3 className="font-display text-2xl font-semibold text-white mb-4">
              Pronto para Experimentar?
            </h3>
            <p className="text-gray-400 mb-6">
              Comece agora mesmo e descubra como a inteligência artificial pode transformar suas conversas empresariais.
            </p>
            <motion.a
              href="/chat"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="premium-button inline-block"
            >
              Iniciar Primeira Conversa
            </motion.a>
          </div>
        </motion.div>

        {/* Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute top-10 right-10 w-24 h-24 border border-purple-500/20 rounded-full"
          />
          <motion.div
            animate={{
              scale: [1.1, 1, 1.1],
              rotate: [360, 180, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute bottom-10 left-10 w-16 h-16 border border-blue-500/20 rounded-full"
          />
        </div>
      </div>
    </section>
  )
}
