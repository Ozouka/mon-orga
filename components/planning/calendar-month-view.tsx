'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from 'date-fns'
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

interface CalendarMonthViewProps {
  currentDate: Date
  interventions: Intervention[]
}

const statusConfig = {
  prevu: { label: 'Prévu', variant: 'secondary' as const },
  en_cours: { label: 'En cours', variant: 'default' as const },
  termine: { label: 'Terminé', variant: 'outline' as const },
  annule: { label: 'Annulé', variant: 'destructive' as const },
}

const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export function CalendarMonthView({ currentDate, interventions }: CalendarMonthViewProps) {
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [carouselOpen, setCarouselOpen] = useState(false)

  // Créer les semaines du mois
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { locale: fr })
  const calendarEnd = endOfWeek(monthEnd, { locale: fr })

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // Grouper les jours par semaine
  const weeks = useMemo(() => {
    const weeksArray: Date[][] = []
    for (let i = 0; i < days.length; i += 7) {
      weeksArray.push(days.slice(i, i + 7))
    }
    return weeksArray
  }, [days])

  // Obtenir les interventions pour une date donnée
  const getInterventionsForDate = (date: Date) => {
    return interventions.filter((intervention) => {
      const interventionDate = new Date(intervention.date_intervention)
      return isSameDay(interventionDate, date)
    })
  }

  const handleDateClick = (date: Date, e: React.MouseEvent) => {
    // Si le clic vient d'un badge d'intervention, ne rien faire ici
    if ((e.target as HTMLElement).closest('[data-intervention-badge]')) {
      return
    }
    
    const dayInterventions = getInterventionsForDate(date)
    if (dayInterventions.length > 0) {
      setSelectedDate(date)
      setCarouselOpen(true)
    }
  }

  const handleInterventionClick = (intervention: Intervention, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedIntervention(intervention)
  }

  return (
    <>
      <div className="flex flex-col gap-2 min-w-0">
        {/* En-têtes des jours */}
        <div className="hidden sm:grid grid-cols-7 gap-1 px-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Semaines */}
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1 min-w-0">
            {week.map((day, dayIndex) => {
              const dayInterventions = getInterventionsForDate(day)
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isToday = isSameDay(day, new Date())

              return (
                <div
                  key={dayIndex}
                  onClick={(e) => handleDateClick(day, e)}
                  className={`
                    flex flex-col gap-1 min-h-[80px] sm:min-h-[100px] p-1 sm:p-2 rounded-md border transition-colors
                    ${isCurrentMonth ? 'bg-background' : 'bg-muted/30'}
                    ${isToday ? 'border-primary ring-2 ring-primary/20' : 'border-border'}
                    ${dayInterventions.length > 0 ? 'cursor-pointer hover:bg-accent' : ''}
                  `}
                >
                  {/* Numéro du jour */}
                  <div className={`
                    text-xs sm:text-sm font-medium shrink-0
                    ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}
                    ${isToday ? 'text-primary font-bold' : ''}
                  `}>
                    {format(day, 'd')}
                  </div>

                  {/* Interventions */}
                  <div className="flex flex-col gap-1 flex-1 min-h-0 overflow-hidden">
                    {dayInterventions.slice(0, 2).map((intervention) => (
                      <Badge
                        key={intervention.id}
                        data-intervention-badge
                        variant={statusConfig[intervention.status].variant}
                        className="text-xs px-1.5 py-0 truncate cursor-pointer shrink-0"
                        onClick={(e) => handleInterventionClick(intervention, e)}
                      >
                        {intervention.title}
                      </Badge>
                    ))}
                    {dayInterventions.length > 2 && (
                      <div className="text-xs text-muted-foreground shrink-0">
                        +{dayInterventions.length - 2}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
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
