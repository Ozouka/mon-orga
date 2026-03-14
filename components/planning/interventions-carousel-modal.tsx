'use client'

import { useState, useEffect, useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, User, MapPin, Phone, Euro, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
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

interface InterventionsCarouselModalProps {
  interventions: Intervention[]
  date: Date
  open: boolean
  onClose: () => void
}

const statusConfig = {
  prevu: { label: 'Prévu', variant: 'secondary' as const },
  en_cours: { label: 'En cours', variant: 'default' as const },
  termine: { label: 'Terminé', variant: 'outline' as const },
  annule: { label: 'Annulé', variant: 'destructive' as const },
}

export function InterventionsCarouselModal({
  interventions,
  date,
  open,
  onClose,
}: InterventionsCarouselModalProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    skipSnaps: false,
    dragFree: false,
    watchDrag: true,
  })

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  const onSelect = useCallback((emblaApi: any) => {
    setSelectedIndex(emblaApi.selectedScrollSnap())
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [])

  useEffect(() => {
    if (!emblaApi) return
    onSelect(emblaApi)
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)

    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi, onSelect])

  // Réinitialiser l'index quand la modale s'ouvre
  useEffect(() => {
    if (open && emblaApi) {
      emblaApi.scrollTo(0)
      setSelectedIndex(0)
    }
  }, [open, emblaApi])

  if (interventions.length === 0) return null

  const currentIntervention = interventions[selectedIndex]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="flex flex-col max-h-[90vh] min-w-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0">
          <DialogTitle>
            Interventions du {format(date, 'EEEE d MMMM yyyy', { locale: fr })}
          </DialogTitle>
          <DialogDescription>
            {interventions.length} intervention{interventions.length > 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 flex-col gap-4 min-h-0">
          {/* Carousel */}
          <div className="flex-1 min-h-0 relative">
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex">
                {interventions.map((intervention) => (
                  <div
                    key={intervention.id}
                    className="flex-[0_0_100%] min-w-0 flex flex-col gap-6 py-4 px-1"
                  >
                    <div className="flex items-center gap-2 shrink-0">
                      <h3 className="text-lg font-semibold flex-1 min-w-0 truncate">
                        {intervention.title}
                      </h3>
                      <Badge variant={statusConfig[intervention.status].variant} className="shrink-0">
                        {statusConfig[intervention.status].label}
                      </Badge>
                    </div>

                    <div className="flex flex-1 flex-col gap-4 min-h-0 overflow-y-auto">
                      {/* Date */}
                      <div className="flex items-start gap-3">
                        <Calendar className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="text-sm font-semibold">Date</span>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(intervention.date_intervention), 'EEEE d MMMM yyyy', { locale: fr })}
                          </span>
                        </div>
                      </div>

                      {/* Client */}
                      <div className="flex items-start gap-3">
                        <User className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="text-sm font-semibold">Client</span>
                          <span className="text-sm text-muted-foreground">
                            {intervention.client.first_name} {intervention.client.last_name}
                          </span>
                          {intervention.client.phone && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {intervention.client.phone}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Adresse */}
                      {(intervention.client.address || intervention.client.city) && (
                        <div className="flex items-start gap-3">
                          <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                          <div className="flex flex-col gap-1 min-w-0">
                            <span className="text-sm font-semibold">Adresse</span>
                            <span className="text-sm text-muted-foreground">
                              {intervention.client.address && (
                                <>
                                  {intervention.client.address}
                                  {intervention.client.city && ', '}
                                </>
                              )}
                              {intervention.client.city}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Montant estimé */}
                      {intervention.estimated_amount && (
                        <div className="flex items-start gap-3">
                          <Euro className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                          <div className="flex flex-col gap-1 min-w-0">
                            <span className="text-sm font-semibold">Montant estimé</span>
                            <span className="text-sm text-muted-foreground">
                              {intervention.estimated_amount.toFixed(2)} €
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Description */}
                      {intervention.description && (
                        <div className="flex items-start gap-3">
                          <FileText className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                          <div className="flex flex-col gap-1 min-w-0">
                            <span className="text-sm font-semibold">Description</span>
                            <span className="text-sm text-muted-foreground">
                              {intervention.description}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Boutons de navigation */}
            {interventions.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full shrink-0"
                  onClick={scrollPrev}
                  disabled={!canScrollPrev}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full shrink-0"
                  onClick={scrollNext}
                  disabled={!canScrollNext}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          {/* Indicateur de position */}
          {interventions.length > 1 && (
            <div className="flex items-center justify-center gap-2 shrink-0 py-2">
              <span className="text-sm text-muted-foreground">
                {selectedIndex + 1} / {interventions.length}
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
