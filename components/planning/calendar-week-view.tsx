'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addDays } from 'date-fns'
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

interface CalendarWeekViewProps {
  currentDate: Date
  interventions: Intervention[]
}

const statusConfig = {
  prevu: { label: 'Prévu', variant: 'secondary' as const },
  en_cours: { label: 'En cours', variant: 'default' as const },
  termine: { label: 'Terminé', variant: 'outline' as const },
  annule: { label: 'Annulé', variant: 'destructive' as const },
}

export function CalendarWeekView({ currentDate, interventions }: CalendarWeekViewProps) {
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [carouselOpen, setCarouselOpen] = useState(false)

  const weekStart = startOfWeek(currentDate, { locale: fr })
  const weekEnd = endOfWeek(currentDate, { locale: fr })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  // Obtenir les interventions pour une date donnée
  const getInterventionsForDate = (date: Date) => {
    return interventions.filter((intervention) => {
      const interventionDate = new Date(intervention.date_intervention)
      return isSameDay(interventionDate, date)
    })
  }

  const handleInterventionClick = (intervention: Intervention, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    setSelectedIntervention(intervention)
  }

  const handleDayClick = (day: Date, dayInterventions: Intervention[]) => {
    if (dayInterventions.length > 0) {
      setSelectedDate(day)
      setCarouselOpen(true)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-2 min-w-0">
        {/* Mobile: Liste verticale */}
        <div className="flex flex-col gap-3 sm:hidden">
          {weekDays.map((day) => {
            const dayInterventions = getInterventionsForDate(day)
            const isToday = isSameDay(day, new Date())

            return (
              <Card 
                key={day.toISOString()} 
                className={`border ${dayInterventions.length > 0 ? 'cursor-pointer hover:bg-accent transition-colors' : ''}`}
                onClick={() => handleDayClick(day, dayInterventions)}
              >
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="flex items-center justify-between shrink-0">
                    <div className="flex flex-col gap-1">
                      <div className={`
                        text-sm font-medium
                        ${isToday ? 'text-primary font-bold' : 'text-foreground'}
                      `}>
                        {format(day, 'EEEE', { locale: fr })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(day, 'd MMMM', { locale: fr })}
                      </div>
                    </div>
                    {isToday && (
                      <Badge variant="default" className="shrink-0">
                        Aujourd&apos;hui
                      </Badge>
                    )}
                  </div>
                  
                  {dayInterventions.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-4">
                      Aucune intervention
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {dayInterventions.map((intervention) => (
                        <Card
                          key={intervention.id}
                          className="border cursor-pointer hover:bg-accent/80 transition-colors"
                          onClick={(e) => handleInterventionClick(intervention, e)}
                        >
                          <CardContent className="flex flex-col gap-2 p-3">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-sm flex-1 min-w-0 truncate">
                                {intervention.title}
                              </h3>
                              <Badge variant={statusConfig[intervention.status].variant} className="shrink-0">
                                {statusConfig[intervention.status].label}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {intervention.client.first_name} {intervention.client.last_name}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Desktop: Timeline horizontale */}
        <div className="hidden sm:flex flex-col gap-2 min-w-0">
          {/* En-têtes des jours */}
          <div className="grid grid-cols-7 gap-2 px-2 shrink-0">
            {weekDays.map((day) => {
              const isToday = isSameDay(day, new Date())
              return (
                <div
                  key={day.toISOString()}
                  className={`
                    flex flex-col gap-1 p-2 rounded-md border text-center
                    ${isToday ? 'border-primary bg-primary/5' : 'border-border'}
                  `}
                >
                  <div className={`
                    text-xs font-medium
                    ${isToday ? 'text-primary' : 'text-muted-foreground'}
                  `}>
                    {format(day, 'EEE', { locale: fr })}
                  </div>
                  <div className={`
                    text-lg font-semibold
                    ${isToday ? 'text-primary' : 'text-foreground'}
                  `}>
                    {format(day, 'd')}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Colonnes des jours */}
          <div className="grid grid-cols-7 gap-2 min-w-0">
            {weekDays.map((day) => {
              const dayInterventions = getInterventionsForDate(day)
              const isToday = isSameDay(day, new Date())

              return (
                <div
                  key={day.toISOString()}
                  className={`
                    flex flex-col gap-2 p-2 rounded-md border min-h-[400px]
                    ${isToday ? 'border-primary bg-primary/5' : 'border-border'}
                    ${dayInterventions.length > 0 ? 'cursor-pointer hover:bg-accent/50 transition-colors' : ''}
                  `}
                  onClick={() => handleDayClick(day, dayInterventions)}
                >
                  {dayInterventions.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-4">
                      Aucune intervention
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {dayInterventions.map((intervention) => (
                        <Card
                          key={intervention.id}
                          className="border cursor-pointer hover:bg-accent/80 transition-colors"
                          onClick={(e) => handleInterventionClick(intervention, e)}
                        >
                          <CardContent className="flex flex-col gap-1.5 p-2">
                            <div className="flex items-center gap-1.5">
                              <Badge variant={statusConfig[intervention.status].variant} className="shrink-0 text-xs">
                                {statusConfig[intervention.status].label}
                              </Badge>
                            </div>
                            <h3 className="font-semibold text-xs truncate">
                              {intervention.title}
                            </h3>
                            <p className="text-xs text-muted-foreground truncate">
                              {intervention.client.first_name} {intervention.client.last_name}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Modal détails pour intervention spécifique */}
      <InterventionDetailsModal
        intervention={selectedIntervention}
        onClose={() => setSelectedIntervention(null)}
      />

      {/* Modal carousel pour toutes les interventions d'une journée */}
      {selectedDate && (
        <InterventionsCarouselModal
          interventions={getInterventionsForDate(selectedDate)}
          date={selectedDate}
          open={carouselOpen}
          onClose={() => {
            setCarouselOpen(false)
            setSelectedDate(null)
          }}
        />
      )}
    </>
  )
}
