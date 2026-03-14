'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function CTASection() {
  return (
    <section className="flex flex-col items-center justify-center gap-6 py-12 sm:py-16 lg:py-24 text-center bg-white rounded-2xl shadow-lg border">
      <h2 className="text-3xl sm:text-4xl font-bold">Prêt à simplifier votre gestion ?</h2>
      <p className="text-lg text-muted-foreground max-w-xl">
        Rejoignez les artisans qui font confiance à MonOrga pour gérer leur activité au quotidien.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild size="lg" className="w-full sm:w-auto bg-black text-white hover:bg-black/90">
          <Link href="/auth/sign-up">
            Créer un compte gratuit
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
          <Link href="/auth/login">
            Se connecter
          </Link>
        </Button>
      </div>
    </section>
  )
}
