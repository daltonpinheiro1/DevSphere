
export const dynamic = 'force-dynamic';

import { Inter, Poppins } from 'next/font/google'
import './globals.css'
import { Metadata } from 'next'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  title: 'DevSphere.ai - Plataforma de Automação e WhatsApp Business',
  description: 'Plataforma avançada de automação empresarial com IA, WhatsApp Business API, chatbots inteligentes e gestão de campanhas para sua organização.',
  keywords: ['chatbot', 'IA', 'AI', 'empresarial', 'WhatsApp', 'automação', 'campanhas', 'Baileys'],
  authors: [{ name: 'DevSphere.ai' }],
  openGraph: {
    title: 'DevSphere.ai - Plataforma de Automação e WhatsApp Business',
    description: 'Plataforma avançada de automação empresarial com IA, WhatsApp Business e chatbots inteligentes.',
    url: '/',
    siteName: 'DevSphere.ai',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'DevSphere.ai - Plataforma de Automação Empresarial'
      }
    ],
    locale: 'pt-BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DevSphere.ai - Plataforma de Automação e WhatsApp Business',
    description: 'Sistema avançado de chatbot AI empresarial com histórico persistente e interface premium.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} ${poppins.variable} font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
            {children}
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
