import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingModal } from '@/components/onboarding-modal'
import { StatsCard } from '@/components/dashboard/stats-card'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { InterventionsList } from '@/components/dashboard/interventions-list'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: authData, error: authError } = await supabase.auth.getUser()
  
  if (authError || !authData.user) {
    redirect('/auth/login')
  }

  const userId = authData.user.id

  const { data: userData } = await supabase
    .from('user_data')
    .select('onboarding_completed')
    .eq('user_id', userId)
    .single()

  const needsOnboarding = !userData || userData.onboarding_completed === false

  // Récupérer les données pour le dashboard
  const today = new Date().toISOString().split('T')[0]
  
  // Interventions aujourd'hui
  const { data: interventionsToday } = await supabase
    .from('interventions')
    .select('id')
    .eq('user_id', userId)
    .eq('date_intervention', today)
    .in('status', ['prevu', 'en_cours'])

  // Devis en attente
  const { data: devisEnAttente } = await supabase
    .from('devis')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'en_attente')

  // Factures impayées
  const { data: facturesImpayees } = await supabase
    .from('factures')
    .select('id, total_ttc')
    .eq('user_id', userId)
    .eq('status', 'impayee')

  // CA du mois
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const { data: caMois } = await supabase
    .from('factures')
    .select('total_ttc')
    .eq('user_id', userId)
    .eq('status', 'payee')
    .gte('paid_at', startOfMonth)

  // CA du mois précédent pour comparaison
  const startOfLastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString()
  const endOfLastMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString()
  const { data: caMoisPrecedent } = await supabase
    .from('factures')
    .select('total_ttc')
    .eq('user_id', userId)
    .eq('status', 'payee')
    .gte('paid_at', startOfLastMonth)
    .lte('paid_at', endOfLastMonth)

  // Calculs
  const interventionsAujourdhui = interventionsToday?.length || 0
  const devisEnAttenteCount = devisEnAttente?.length || 0
  const facturesImpayeesCount = facturesImpayees?.length || 0
  const caMoisActuel = caMois?.reduce((sum, f) => sum + (Number(f.total_ttc) || 0), 0) || 0
  const caMoisPrecedentTotal = caMoisPrecedent?.reduce((sum, f) => sum + (Number(f.total_ttc) || 0), 0) || 0
  const evolutionCA = caMoisPrecedentTotal > 0 
    ? ((caMoisActuel - caMoisPrecedentTotal) / caMoisPrecedentTotal) * 100 
    : 0

  // Récupérer le CA sur les 12 derniers mois
  const now = new Date()
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)
  const { data: facturesAnnee } = await supabase
    .from('factures')
    .select('total_ttc, paid_at')
    .eq('user_id', userId)
    .eq('status', 'payee')
    .gte('paid_at', twelveMonthsAgo.toISOString())
    .order('paid_at', { ascending: true })

  // Grouper par mois et calculer le CA mensuel
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
  const revenueByMonth: Record<string, number> = {}
  
  // Initialiser tous les mois à 0
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    revenueByMonth[monthKey] = 0
  }

  // Calculer le CA par mois
  facturesAnnee?.forEach((facture) => {
    if (facture.paid_at) {
      const date = new Date(facture.paid_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (revenueByMonth[monthKey] !== undefined) {
        revenueByMonth[monthKey] += Number(facture.total_ttc) || 0
      }
    }
  })

  // Créer le tableau de données pour le graphique (12 derniers mois)
  const revenueData = Object.entries(revenueByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, revenue]) => {
      const [, month] = monthKey.split('-')
      const monthIndex = parseInt(month) - 1
      return {
        month: monthNames[monthIndex],
        revenue: Math.round(revenue * 100) / 100, // Arrondir à 2 décimales
      }
    })

  // Données pour les graphiques (mini charts dans les cartes)
  // Valeurs fixes pour éviter Math.random() dans le render
  const generateTrendData = (value: number) => {
    const baseValue = value || 1
    return Array.from({ length: 7 }, () => ({
      value: baseValue * (0.8 + (baseValue % 0.4)),
    }))
  }

  // Prochaines interventions (7 prochains jours)
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  const { data: prochainesInterventionsData } = await supabase
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
    .gte('date_intervention', today)
    .lte('date_intervention', nextWeek.toISOString().split('T')[0])
    .in('status', ['prevu', 'en_cours'])
    .order('date_intervention', { ascending: true })
    .limit(5)

  // Récupérer les clients pour les interventions
  const clientIds = prochainesInterventionsData?.map(i => i.client_id).filter(Boolean) || []
  const { data: clientsData } = await supabase
    .from('clients')
    .select('id, first_name, last_name, phone, address, city')
    .eq('user_id', userId)
    .in('id', clientIds)

  // Combiner les données
  const prochainesInterventions = prochainesInterventionsData?.map(intervention => ({
    ...intervention,
    client: clientsData?.find(c => c.id === intervention.client_id) || {
      id: intervention.client_id || '',
      first_name: '',
      last_name: '',
      phone: '',
      address: null,
      city: null,
    },
  })) || []

  return (
    <>
      {needsOnboarding && <OnboardingModal />}
      <div className="flex flex-col gap-6 p-4 sm:p-6 min-w-0">
        {/* Header */}
        <div className="flex flex-col gap-1 shrink-0">
          <h1 className="text-2xl sm:text-3xl font-bold">Tableau de bord</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Vue d&apos;ensemble de votre activité
          </p>
        </div>

        {/* Interventions à venir - Visible uniquement sur mobile */}
        <div className="flex flex-col gap-4 lg:hidden">
          <InterventionsList 
            interventions={prochainesInterventions || []} 
          />
        </div>

        {/* Cartes statistiques - Flexbox simple */}
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
          <div className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)] min-w-0 shrink-0">
            <StatsCard
              title="Interventions aujourd&apos;hui"
              value={interventionsAujourdhui}
              change={0}
              trend={generateTrendData(interventionsAujourdhui)}
              color="hsl(var(--chart-1))"
            />
          </div>
          <div className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)] min-w-0 shrink-0">
            <StatsCard
              title="Devis en attente"
              value={devisEnAttenteCount}
              change={0}
              trend={generateTrendData(devisEnAttenteCount)}
              color="hsl(var(--chart-2))"
            />
          </div>
          <div className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)] min-w-0 shrink-0">
            <StatsCard
              title="Factures impayées"
              value={facturesImpayeesCount}
              change={0}
              trend={generateTrendData(facturesImpayeesCount)}
              color="hsl(var(--chart-3))"
            />
          </div>
          <div className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)] min-w-0 shrink-0">
            <StatsCard
              title="CA du mois"
              value={`${caMoisActuel.toFixed(0)} €`}
              change={evolutionCA}
              trend={generateTrendData(caMoisActuel)}
              color="hsl(var(--chart-4))"
            />
          </div>
        </div>

        {/* Graphique CA et Liste interventions - Desktop */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 min-w-0 lg:flex-2 shrink-0">
            <RevenueChart data={revenueData} />
          </div>
          <div className="hidden lg:flex flex-1 min-w-0 lg:flex-1 shrink-0">
            <InterventionsList 
              interventions={prochainesInterventions || []} 
            />
          </div>
        </div>
      </div>
    </>
  )
}
