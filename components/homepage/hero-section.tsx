'use client'

import HeroSectionComponent from '@/components/ui/hero-section-9'
import { Users, Briefcase, Calendar } from 'lucide-react'

export function HeroSection() {
  const heroData = {
    title: (
      <>
        Gérez votre activité d&apos;artisan
        <br />
        <span className="text-primary">simplement et efficacement</span>
      </>
    ),
    subtitle: 'MonOrga est l\'outil de gestion tout-en-un pour les artisans et petites entreprises. Gérez vos clients, interventions, devis et factures en un seul endroit.',
    actions: [
      {
        text: 'Commencer gratuitement',
        href: '/auth/sign-up',
        variant: 'default' as const,
      },
      {
        text: 'Se connecter',
        href: '/auth/login',
        variant: 'outline' as const,
      },
    ],
    stats: [
      {
        value: 'Gestion',
        label: 'complète',
        icon: <Briefcase className="h-5 w-5 text-muted-foreground" />,
      },
      {
        value: 'Clients',
        label: 'centralisés',
        icon: <Users className="h-5 w-5 text-muted-foreground" />,
      },
      {
        value: 'Planning',
        label: 'optimisé',
        icon: <Calendar className="h-5 w-5 text-muted-foreground" />,
      },
    ],
    images: [
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0',
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0',
      'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0',
    ],
  }

  return (
    <HeroSectionComponent
      title={heroData.title}
      subtitle={heroData.subtitle}
      actions={heroData.actions}
      stats={heroData.stats}
      images={heroData.images}
    />
  )
}
