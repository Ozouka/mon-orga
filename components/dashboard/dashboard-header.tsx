import { SidebarTrigger } from "@/components/ui/sidebar"
import { LogoutButton } from "@/components/logout-button"
import { User } from "@supabase/supabase-js"

interface DashboardHeaderProps {
  user: User
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger />
      <div className="flex flex-1 items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            {user.email}
          </span>
        </div>
        <LogoutButton />
      </div>
    </header>
  )
}
