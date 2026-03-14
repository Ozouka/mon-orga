import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from '@/components/settings/settings-form'

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError || !authData.user) {
    redirect('/auth/login')
  }

  const userId = authData.user.id
  const userEmail = authData.user.email || ''

  // Récupérer les données utilisateur
  const { data: userData, error } = await supabase
    .from('user_data')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned, ce qui est normal pour un nouvel utilisateur
    console.error('Erreur lors de la récupération des données:', error)
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 min-w-0">
      <div className="flex flex-col gap-1 shrink-0">
        <h1 className="text-2xl sm:text-3xl font-bold">Paramètres</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Gérez vos informations personnelles et celles de votre entreprise
        </p>
      </div>

      <SettingsForm userData={userData} userEmail={userEmail} />
    </div>
  )
}
