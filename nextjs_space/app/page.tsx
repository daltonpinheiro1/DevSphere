
import { Hero } from '@/components/landing/hero'
import { Features } from '@/components/landing/features'
import { HowItWorks } from '@/components/landing/how-it-works'
import { UseCases } from '@/components/landing/use-cases'
import { Footer } from '@/components/landing/footer'
import { Header } from '@/components/landing/header'

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="relative">
        <Hero />
        <Features />
        <HowItWorks />
        <UseCases />
      </main>
      <Footer />
    </>
  )
}
