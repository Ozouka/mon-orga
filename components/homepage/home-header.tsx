 'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function HomeHeader() {
  return (
    <header className="w-full sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          MonOrga
        </Link>
        <nav className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/auth/login">Se connecter</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="bg-black text-white hover:bg-black/90"
          >
            <Link href="/auth/sign-up">Créer un compte</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}

