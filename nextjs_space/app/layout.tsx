
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
  title: 'CENTER AI OMNI - Chatbot IA Empresarial Premium',
  description: 'Sistema avançado de chatbot AI empresarial com histórico persistente, interface premium e integração completa para sua organização.',
  keywords: ['chatbot', 'IA', 'AI', 'empresarial', 'premium', 'conversas', 'automação'],
  authors: [{ name: 'CENTER AI OMNI' }],
  openGraph: {
    title: 'CENTER AI OMNI - Chatbot IA Empresarial Premium',
    description: 'Sistema avançado de chatbot AI empresarial com histórico persistente e interface premium.',
    url: '/',
    siteName: 'CENTER AI OMNI',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CENTER AI OMNI - Chatbot IA Empresarial'
      }
    ],
    locale: 'pt-BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CENTER AI OMNI - Chatbot IA Empresarial Premium',
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
