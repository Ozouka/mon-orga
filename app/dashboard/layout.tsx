import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Vérifier l'authentification
  const { data: authData, error: authError } = await supabase.auth.getUser()
  
  if (authError || !authData.user) {
    redirect('/auth/login')
  }

  // Note: L'onboarding est géré dans la page dashboard, pas dans le layout
  // pour éviter les boucles de redirection

  // Récupérer l'état de la sidebar depuis les cookies
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <main className="flex flex-1 flex-col min-w-0">
        <DashboardHeader user={authData.user} />
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </SidebarProvider>
  )
}
