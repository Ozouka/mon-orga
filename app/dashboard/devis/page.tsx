import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DevisFacturesList } from '@/components/devis/devis-factures-list'

export default async function DevisPage() {
  const supabase = await createClient()

  const { data: authData, error: authError } = await supabase.auth.getUser()
  
  if (authError || !authData.user) {
    redirect('/auth/login')
  }

  const userId = authData.user.id

  const { data: devisData, error: devisError } = await supabase
    .from('devis')
    .select(`
      id,
      number,
      created_at,
      total_ht,
      total_ttc,
      status,
      client_id,
      intervention_id
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (devisError) {
    console.error('Erreur lors de la récupération des devis:', devisError)
  }

  const { data: facturesData, error: facturesError } = await supabase
    .from('factures')
    .select(`
      id,
      number,
      created_at,
      date_echeance,
      total_ht,
      total_ttc,
      status,
      paid_at,
      client_id,
      intervention_id,
      devis_id
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (facturesError) {
    console.error('Erreur lors de la récupération des factures:', facturesError)
  }

  const clientIds = [
    ...(devisData?.map(d => d.client_id).filter(Boolean) || []),
    ...(facturesData?.map(f => f.client_id).filter(Boolean) || [])
  ]
  const uniqueClientIds = [...new Set(clientIds)]
  
  const { data: clientsData } = await supabase
    .from('clients')
    .select('id, first_name, last_name, phone, address, city')
    .eq('user_id', userId)
    .in('id', uniqueClientIds)

    const devis = devisData?.map(devis => ({
      ...devis,
      client: clientsData?.find(c => c.id === devis.client_id) || {
        id: devis.client_id || '', 
        first_name: '',
        last_name: '',
        phone: '',
        address: null,
        city: null,
      },
    })) || []
    
    const factures = facturesData?.map(facture => ({
      ...facture,
      client: clientsData?.find(c => c.id === facture.client_id) || {
        id: facture.client_id || '',
        first_name: '',
        last_name: '',
        phone: '',
        address: null,
        city: null,
      },
    })) || []

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 min-w-0">
      <DevisFacturesList devis={devis} factures={factures} />
    </div>
  )
}
