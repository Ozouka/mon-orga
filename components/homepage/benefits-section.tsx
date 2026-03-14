'use client'

import { Check } from 'lucide-react'

const benefits = [
  'Gain de temps sur la gestion administrative',
  'Suivi en temps réel de votre activité',
  'Facturation simplifiée et professionnelle',
  'Planning optimisé pour une meilleure organisation',
  'Données sécurisées et accessibles partout',
  'Interface intuitive et moderne',
]

export function BenefitsSection() {
  return (
    <section className="flex flex-col gap-6 py-12 sm:py-16">
      <div className="flex flex-col gap-2 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold">Pourquoi choisir MonOrga ?</h2>
        <p className="text-lg text-muted-foreground">
          Des avantages concrets pour votre activité
        </p>
      </div>
      <div className="flex flex-col gap-3 max-w-2xl mx-auto w-full">
        {benefits.map((benefit, index) => (
          <div key={index} className="flex items-start gap-3 p-4 rounded-lg border bg-white shadow-sm">
            <div className="p-1 rounded-full bg-primary/10 shrink-0 mt-0.5">
              <Check className="h-4 w-4 text-primary" />
            </div>
            <p className="text-base sm:text-lg">{benefit}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
