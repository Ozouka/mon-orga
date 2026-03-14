'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Wrench, FileText, Calendar } from 'lucide-react'

const features = [
  {
    title: 'Gestion des clients',
    description: 'Centralisez toutes les informations de vos clients et gardez un historique complet de vos échanges.',
    icon: Users,
  },
  {
    title: 'Suivi des interventions',
    description: 'Planifiez et suivez vos interventions avec un système de statuts clair et intuitif.',
    icon: Wrench,
  },
  {
    title: 'Devis & Factures',
    description: 'Créez et gérez vos devis et factures facilement, avec un suivi des paiements intégré.',
    icon: FileText,
  },
  {
    title: 'Planning visuel',
    description: 'Visualisez votre planning avec un calendrier interactif pour une meilleure organisation.',
    icon: Calendar,
  },
]

export function FeaturesSection() {
  return (
    <section className="flex flex-col gap-8 py-12 sm:py-16">
      <div className="flex flex-col gap-2 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold">Tout ce dont vous avez besoin</h2>
        <p className="text-lg text-muted-foreground">
          Des fonctionnalités pensées pour simplifier votre quotidien
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((feature) => (
          <Card key={feature.title} className="flex flex-col bg-white rounded-lg shadow-sm border">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-md bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </div>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  )
}
