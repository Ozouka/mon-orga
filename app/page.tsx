import { HeroSection } from '@/components/homepage/hero-section'
import { FeaturesSection } from '@/components/homepage/features-section'
import { BenefitsSection } from '@/components/homepage/benefits-section'
import { CTASection } from '@/components/homepage/cta-section'
import { HomeHeader } from '@/components/homepage/home-header'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-dotted-pattern">
      <HomeHeader />
      <main className="flex flex-1 flex-col gap-12 sm:gap-16 lg:gap-24 px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 max-w-7xl mx-auto w-full">
        <HeroSection />
        <FeaturesSection />
        <BenefitsSection />
        <CTASection />
      </main>
    </div>
  )
}
