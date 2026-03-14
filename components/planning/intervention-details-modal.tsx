'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Calendar, User, MapPin, Phone, Euro, FileText } from 'lucide-react'
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

interface InterventionDetailsModalProps {
  intervention: Intervention | null
  onClose: () => void
}

const statusConfig = {
  prevu: { label: 'Prévu', variant: 'secondary' as const },
  en_cours: { label: 'En cours', variant: 'default' as const },
  termine: { label: 'Terminé', variant: 'outline' as const },
  annule: { label: 'Annulé', variant: 'destructive' as const },
}

export function InterventionDetailsModal({ intervention, onClose }: InterventionDetailsModalProps) {
  if (!intervention) return null

  return (
    <Dialog open={!!intervention} onOpenChange={onClose}>
      <DialogContent className="flex flex-col max-h-[90vh] min-w-0 sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{intervention.title}</DialogTitle>
            <Badge variant={statusConfig[intervention.status].variant}>
              {statusConfig[intervention.status].label}
            </Badge>
          </div>
          <DialogDescription>
            Détails de l&apos;intervention
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 flex-col gap-6 py-4 min-h-0 overflow-y-auto">
          <div className="flex flex-col gap-4">
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
      </DialogContent>
    </Dialog>
  )
}
