import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InterventionsList } from '@/components/interventions/interventions-list'

export default async function InterventionsPage() {
  const supabase = await createClient()

  const { data: authData, error: authError } = await supabase.auth.getUser()
  
  if (authError || !authData.user) {
    redirect('/auth/login')
  }

  const userId = authData.user.id
  const today = new Date().toISOString().split('T')[0]

  // Récupérer toutes les interventions de l'utilisateur avec les clients
  const { data: interventionsData, error } = await supabase
    .from('interventions')
    .select(`
      id,
      title,
      description,
      status,
      date_intervention,
      estimated_amount,
      client_id
    `)
    .eq('user_id', userId)
    .order('date_intervention', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erreur lors de la récupération des interventions:', error)
  }

  // Récupérer les clients pour les interventions
  const clientIds = interventionsData?.map(i => i.client_id).filter(Boolean) || []
  const { data: clientsData } = await supabase
    .from('clients')
    .select('id, first_name, last_name, phone, address, city')
    .eq('user_id', userId)
    .in('id', clientIds)

  // Combiner les données
  const interventions = interventionsData?.map(intervention => ({
    ...intervention,
    client: clientsData?.find(c => c.id === intervention.client_id) || {
      first_name: '',
      last_name: '',
      phone: '',
      address: null,
      city: null,
    },
  })) || []

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 min-w-0">
      <InterventionsList interventions={interventions} />
    </div>
  )
}
