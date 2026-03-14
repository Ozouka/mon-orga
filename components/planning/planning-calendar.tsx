'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CalendarMonthView } from './calendar-month-view'
import { CalendarWeekView } from './calendar-week-view'
import { CalendarDayView } from './calendar-day-view'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfDay } from 'date-fns'
import { fr } from 'date-fns/locale'

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

interface PlanningCalendarProps {
  interventions: Intervention[]
}

type ViewType = 'month' | 'week' | 'day'

export function PlanningCalendar({ interventions }: PlanningCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<ViewType>('month')

  const handlePrevious = () => {
    if (view === 'month') {
      setCurrentDate(subMonths(currentDate, 1))
    } else if (view === 'week') {
      setCurrentDate(subWeeks(currentDate, 1))
    } else {
      setCurrentDate(subDays(currentDate, 1))
    }
  }

  const handleNext = () => {
    if (view === 'month') {
      setCurrentDate(addMonths(currentDate, 1))
    } else if (view === 'week') {
      setCurrentDate(addWeeks(currentDate, 1))
    } else {
      setCurrentDate(addDays(currentDate, 1))
    }
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const getViewTitle = () => {
    if (view === 'month') {
      return format(currentDate, 'MMMM yyyy', { locale: fr })
    } else if (view === 'week') {
      const weekStart = startOfWeek(currentDate, { locale: fr })
      const weekEnd = endOfWeek(currentDate, { locale: fr })
      return `${format(weekStart, 'd MMM', { locale: fr })} - ${format(weekEnd, 'd MMM yyyy', { locale: fr })}`
    } else {
      return format(currentDate, 'EEEE d MMMM yyyy', { locale: fr })
    }
  }

  return (
    <div className="flex flex-col gap-6 min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-4 shrink-0">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold">Planning</h1>
          
          {/* Sélecteur de vue */}
          <div className="flex gap-2 shrink-0">
            <Button
              variant={view === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('month')}
            >
              Mois
            </Button>
            <Button
              variant={view === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('week')}
            >
              Semaine
            </Button>
            <Button
              variant={view === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('day')}
            >
              Jour
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={handleToday}
              className="min-w-[100px]"
            >
              Aujourd&apos;hui
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-lg font-semibold capitalize">
            {getViewTitle()}
          </h2>
        </div>
      </div>

      {/* Vue du calendrier */}
      <div className="flex-1 min-w-0">
        {view === 'month' && (
          <CalendarMonthView
            currentDate={currentDate}
            interventions={interventions}
          />
        )}
        {view === 'week' && (
          <CalendarWeekView
            currentDate={currentDate}
            interventions={interventions}
          />
        )}
        {view === 'day' && (
          <CalendarDayView
            currentDate={currentDate}
            interventions={interventions}
          />
        )}
      </div>
    </div>
  )
}
