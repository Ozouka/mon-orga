'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format, isSameDay, startOfDay, endOfDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { InterventionDetailsModal } from './intervention-details-modal'
import { InterventionsCarouselModal } from './interventions-carousel-modal'

interface Client {
  id: string
  first_name: string
  last_name: string
  phone: string
  address: string | null
  city: string | null
}

interface Intervention {
  id: string
  title: string
  description: string | null
  status: 'prevu' | 'en_cours' | 'termine' | 'annule'
  date_intervention: string
  estimated_amount: number | null
  client_id: string
  client: Client
}

interface CalendarDayViewProps {
  currentDate: Date
  interventions: Intervention[]
}

const statusConfig = {
  prevu: { label: 'Prévu', variant: 'secondary' as const },
  en_cours: { label: 'En cours', variant: 'default' as const },
  termine: { label: 'Terminé', variant: 'outline' as const },
  annule: { label: 'Annulé', variant: 'destructive' as const },
}

export function CalendarDayView({ currentDate, interventions }: CalendarDayViewProps) {
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null)
  const [carouselOpen, setCarouselOpen] = useState(false)

  // Filtrer les interventions du jour
  const dayInterventions = useMemo(() => {
    return interventions.filter((intervention) => {
      const interventionDate = new Date(intervention.date_intervention)
      return isSameDay(interventionDate, currentDate)
    })
  }, [interventions, currentDate])

  const isToday = isSameDay(currentDate, new Date())

  const handleInterventionClick = (intervention: Intervention, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    setSelectedIntervention(intervention)
  }

  const handleDayClick = () => {
    if (dayInterventions.length > 0) {
      setCarouselOpen(true)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-4 min-w-0">
        {/* En-tête du jour */}
        <div className="flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl sm:text-2xl font-bold capitalize">
                {format(currentDate, 'EEEE d MMMM yyyy', { locale: fr })}
              </h2>
            </div>
            {isToday && (
              <Badge variant="default" className="shrink-0">
                Aujourd&apos;hui
              </Badge>
            )}
          </div>
        </div>

        {/* Liste des interventions */}
        {dayInterventions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground text-center">
                Aucune intervention prévue pour ce jour
              </p>
            </CardContent>
          </Card>
        ) : (
          <div 
            className="flex flex-col gap-3 cursor-pointer"
            onClick={handleDayClick}
          >
            {dayInterventions.map((intervention) => (
              <Card
                key={intervention.id}
                className="border cursor-pointer hover:bg-accent/80 transition-colors"
                onClick={(e) => handleInterventionClick(intervention, e)}
              >
                <CardContent className="flex flex-col gap-3 p-4 sm:p-6">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-base flex-1 min-w-0">
                        {intervention.title}
                      </h3>
                      <Badge variant={statusConfig[intervention.status].variant} className="shrink-0">
                        {statusConfig[intervention.status].label}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                      <div>
                        <strong>Client:</strong> {intervention.client.first_name} {intervention.client.last_name}
                      </div>
                      {intervention.client.phone && (
                        <div>
                          <strong>Téléphone:</strong> {intervention.client.phone}
                        </div>
                      )}
                      {intervention.client.city && (
                        <div>
                          <strong>Ville:</strong> {intervention.client.city}
                        </div>
                      )}
                      {intervention.estimated_amount && (
                        <div>
                          <strong>Montant estimé:</strong> {intervention.estimated_amount.toFixed(2)} €
                        </div>
                      )}
                    </div>

                    {intervention.description && (
                      <div className="text-sm text-muted-foreground">
                        <strong>Description:</strong> {intervention.description}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal détails pour intervention spécifique */}
      <InterventionDetailsModal
        intervention={selectedIntervention}
        onClose={() => setSelectedIntervention(null)}
      />

      {/* Modal carousel pour toutes les interventions du jour */}
      <InterventionsCarouselModal
        interventions={dayInterventions}
        date={currentDate}
        open={carouselOpen}
        onClose={() => setCarouselOpen(false)}
      />
    </>
  )
}
