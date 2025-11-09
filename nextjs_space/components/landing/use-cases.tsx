
'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Building2, HeadphonesIcon, Users, Zap } from 'lucide-react'

const useCases = [
  {
    icon: HeadphonesIcon,
    title: 'Atendimento ao Cliente',
    description: 'Respostas automáticas 24/7, resolução de dúvidas frequentes e direcionamento especializado para cases complexos.',
    benefits: ['Redução de 80% no tempo de resposta', 'Satisfação do cliente elevada', 'Disponibilidade constante']
  },
  {
    icon: Users,
    title: 'Suporte Interno',
    description: 'Assistente virtual para funcionários, acesso a informações corporativas e automação de processos internos.',
    benefits: ['Maior produtividade da equipe', 'Acesso rápido a informações', 'Redução de tickets internos']
  },
  {
    icon: Building2,
    title: 'Consultas Empresariais',
    description: 'Análise de dados, geração de relatórios inteligentes e insights estratégicos para tomada de decisão.',
    benefits: ['Decisões baseadas em dados', 'Relatórios automatizados', 'Análises preditivas']
  },
  {
    icon: Zap,
    title: 'Automação de Processos',
    description: 'Integração com sistemas existentes, automação de workflows e otimização de operações repetitivas.',
    benefits: ['Redução de erros humanos', 'Economia de tempo', 'Processos padronizados']
  }
]

export function UseCases() {
  return (
    <section id="casos-uso" className="py-24 relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://cdn.abacus.ai/images/a6181004-fbed-4501-9b3f-21ace035302d.png"
          alt="Corporate AI Usage"
          fill
          className="object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-blue-900/80 to-purple-900/90" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-6">
            Casos de <span className="premium-text-gradient">Uso</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Descubra como a DevSphere.ai pode transformar diferentes áreas da sua organização.
          </p>
        </motion.div>

        {/* Use Cases Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {useCases.map((useCase, index) => (
            <motion.div
              key={useCase.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="premium-card p-8 group hover:scale-[1.02] transition-all duration-500"
            >
              {/* Header */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="premium-gradient p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <useCase.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-display text-xl font-semibold text-white">
                  {useCase.title}
                </h3>
              </div>

              {/* Description */}
              <p className="text-gray-400 leading-relaxed mb-6">
                {useCase.description}
              </p>

              {/* Benefits */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-purple-300 uppercase tracking-wider">
                  Principais Benefícios
                </h4>
                <ul className="space-y-2">
                  {useCase.benefits.map((benefit, benefitIndex) => (
                    <motion.li
                      key={benefit}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: (index * 0.2) + (benefitIndex * 0.1) }}
                      viewport={{ once: true }}
                      className="flex items-center text-gray-300 text-sm"
                    >
                      <div className="w-1.5 h-1.5 premium-gradient rounded-full mr-3 flex-shrink-0" />
                      {benefit}
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-600/0 to-purple-600/0 group-hover:from-blue-600/5 group-hover:to-purple-600/5 transition-all duration-500" />
            </motion.div>
          ))}
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <div className="premium-card p-8 text-center">
            <h3 className="font-display text-2xl font-semibold text-white mb-8">
              Impacto <span className="premium-text-gradient">Mensurável</span>
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <div className="text-3xl font-bold premium-text-gradient mb-2 animated-counter">85%</div>
                <div className="text-sm text-gray-400">Redução de Tempo</div>
              </div>
              <div>
                <div className="text-3xl font-bold premium-text-gradient mb-2 animated-counter">92%</div>
                <div className="text-sm text-gray-400">Satisfação</div>
              </div>
              <div>
                <div className="text-3xl font-bold premium-text-gradient mb-2 animated-counter">24/7</div>
                <div className="text-sm text-gray-400">Disponibilidade</div>
              </div>
              <div>
                <div className="text-3xl font-bold premium-text-gradient mb-2 animated-counter">∞</div>
                <div className="text-sm text-gray-400">Escalabilidade</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
