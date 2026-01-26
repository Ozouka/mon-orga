'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, User, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Intervention {
  id: string
  title: string
  description: string | null
  status: 'prevu' | 'en_cours' | 'termine' | 'annule'
  date_intervention: string
  estimated_amount: number | null
  client: {
    first_name: string
    last_name: string
    phone: string
    address: string | null
    city: string | null
  }
}

interface InterventionsListProps {
  interventions: Intervention[]
}

const statusConfig = {
  prevu: { label: 'Prévu', variant: 'secondary' as const },
  en_cours: { label: 'En cours', variant: 'default' as const },
  termine: { label: 'Terminé', variant: 'outline' as const },
  annule: { label: 'Annulé', variant: 'destructive' as const },
}

export function InterventionsList({ interventions }: InterventionsListProps) {
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null)

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Interventions à venir</CardTitle>
          <CardDescription>Vos prochaines interventions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {interventions.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                Aucune intervention prévue
              </div>
            ) : (
              interventions.map((intervention) => (
                <div
                  key={intervention.id}
                  onClick={() => setSelectedIntervention(intervention)}
                  className="flex flex-col gap-2 rounded-lg border p-4 transition-colors hover:bg-accent cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-1 flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{intervention.title}</h3>
                        <Badge variant={statusConfig[intervention.status].variant}>
                          {statusConfig[intervention.status].label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {intervention.client.first_name} {intervention.client.last_name}
                      </p>
                    </div>
                    {intervention.estimated_amount && (
                      <div className="text-right shrink-0">
                        <div className="font-semibold">
                          {intervention.estimated_amount.toFixed(2)} €
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {format(new Date(intervention.date_intervention), 'd MMM yyyy', { locale: fr })}
                      </span>
                    </div>
                    {intervention.client.city && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{intervention.client.city}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Sheet open={!!selectedIntervention} onOpenChange={(open) => !open && setSelectedIntervention(null)}>
        <SheetContent className="flex flex-col min-w-0 sm:max-w-md">
          {selectedIntervention && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedIntervention.title}</SheetTitle>
                <SheetDescription>
                  Détails de l'intervention
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-1 flex-col gap-6 py-6 overflow-y-auto">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={statusConfig[selectedIntervention.status].variant}>
                      {statusConfig[selectedIntervention.status].label}
                    </Badge>
                  </div>

                  {selectedIntervention.description && (
                    <div className="flex flex-col gap-2">
                      <h4 className="text-sm font-semibold">Description</h4>
                      <p className="text-sm text-muted-foreground">{selectedIntervention.description}</p>
                    </div>
                  )}

                  <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-sm font-semibold">Date</span>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(selectedIntervention.date_intervention), 'EEEE d MMMM yyyy', { locale: fr })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <User className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-sm font-semibold">Client</span>
                        <span className="text-sm text-muted-foreground">
                          {selectedIntervention.client.first_name} {selectedIntervention.client.last_name}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {selectedIntervention.client.phone}
                        </span>
                      </div>
                    </div>

                    {selectedIntervention.client.address && (
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="text-sm font-semibold">Adresse</span>
                          <span className="text-sm text-muted-foreground">
                            {selectedIntervention.client.address}
                            {selectedIntervention.client.city && `, ${selectedIntervention.client.city}`}
                          </span>
                        </div>
                      </div>
                    )}

                    {selectedIntervention.estimated_amount && (
                      <div className="flex items-start gap-3">
                        <Clock className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="text-sm font-semibold">Montant estimé</span>
                          <span className="text-sm text-muted-foreground">
                            {selectedIntervention.estimated_amount.toFixed(2)} €
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
