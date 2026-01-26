import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClientsList } from '@/components/clients/clients-list'

export default async function ClientsPage() {
  const supabase = await createClient()

  const { data: authData, error: authError } = await supabase.auth.getUser()
  
  if (authError || !authData.user) {
    redirect('/auth/login')
  }

  const userId = authData.user.id

  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, first_name, last_name, phone, address, city')
    .eq('user_id', userId)
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true })

  if (error) {
    console.error('Erreur lors de la récupération des clients:', error)
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 min-w-0">
      <ClientsList clients={clients || []} />
    </div>
  )
}
