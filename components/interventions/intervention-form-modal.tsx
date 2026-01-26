'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Client {
  id: string
  first_name: string
  last_name: string
}

interface Intervention {
  id: string
  title: string
  description: string | null
  status: 'prevu' | 'en_cours' | 'termine' | 'annule'
  date_intervention: string
  estimated_amount: number | null
  client_id: string
}

interface InterventionFormModalProps {
  open: boolean
  onClose: () => void
  intervention?: Intervention | null
}

export function InterventionFormModal({ open, onClose, intervention }: InterventionFormModalProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [isLoadingClients, setIsLoadingClients] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'prevu' as 'prevu' | 'en_cours' | 'termine' | 'annule',
    date_intervention: '',
    estimated_amount: '',
    client_id: '',
  })
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

  // Charger les clients au montage et quand la modal s'ouvre
  useEffect(() => {
    if (open) {
      loadClients()
    }
  }, [open])

  const loadClients = async () => {
    setIsLoadingClients(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Utilisateur non connecté')
      }

      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name')
        .eq('user_id', user.id)
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true })

      if (error) throw error
      setClients(data || [])
    } catch (err) {
      console.error('Erreur lors du chargement des clients:', err)
      toast.error('Erreur', {
        description: 'Impossible de charger la liste des clients',
      })
    } finally {
      setIsLoadingClients(false)
    }
  }

  // Initialiser le formulaire avec les données de l'intervention si en mode édition
  useEffect(() => {
    if (intervention) {
      const date = intervention.date_intervention ? new Date(intervention.date_intervention) : undefined
      setSelectedDate(date)
      setFormData({
        title: intervention.title || '',
        description: intervention.description || '',
        status: intervention.status || 'prevu',
        date_intervention: intervention.date_intervention ? intervention.date_intervention.split('T')[0] : '',
        estimated_amount: intervention.estimated_amount ? intervention.estimated_amount.toString() : '',
        client_id: intervention.client_id || '',
      })
    } else {
      // Réinitialiser le formulaire pour la création
      const today = new Date()
      setSelectedDate(today)
      const todayStr = today.toISOString().split('T')[0]
      setFormData({
        title: '',
        description: '',
        status: 'prevu',
        date_intervention: todayStr,
        estimated_amount: '',
        client_id: '',
      })
    }
    setError(null)
  }, [intervention, open])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = document.getElementById('description') as HTMLTextAreaElement
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [formData.description])

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    // Validation
    if (!formData.title.trim()) {
      setError('Le titre est obligatoire')
      setIsSubmitting(false)
      return
    }

    if (!formData.client_id) {
      setError('Le client est obligatoire')
      setIsSubmitting(false)
      return
    }

    if (!formData.date_intervention) {
      setError('La date est obligatoire')
      setIsSubmitting(false)
      return
    }

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Utilisateur non connecté')
      }

      const interventionData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        status: formData.status,
        date_intervention: formData.date_intervention,
        estimated_amount: formData.estimated_amount ? parseFloat(formData.estimated_amount) : null,
        client_id: formData.client_id,
        user_id: user.id,
      }

      if (intervention) {
        // Mode édition
        const { error } = await supabase
          .from('interventions')
          .update(interventionData)
          .eq('id', intervention.id)
          .eq('user_id', user.id)

        if (error) throw error

        toast.success('Intervention modifiée avec succès', {
          description: `${formData.title} a été modifiée`,
          style: {
            color: '#22c55e',
          },
          classNames: {
            title: '!text-green-500',
            description: '!text-green-500',
          },
        })
      } else {
        // Mode création
        const { error } = await supabase
          .from('interventions')
          .insert(interventionData)

        if (error) throw error

        toast.success('Intervention créée avec succès', {
          description: `${formData.title} a été ajoutée`,
          style: {
            color: '#22c55e',
          },
          classNames: {
            title: '!text-green-500',
            description: '!text-green-500',
          },
        })
      }

      router.refresh()
      onClose()
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err)
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue'
      setError(errorMessage)
      toast.error('Erreur', {
        description: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="flex flex-col max-h-[90vh] min-w-0 sm:max-w-lg">
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col min-h-0">
          <DialogHeader>
            <DialogTitle>
              {intervention ? 'Modifier l\'intervention' : 'Créer une intervention'}
            </DialogTitle>
            <DialogDescription>
              {intervention
                ? 'Modifiez les informations de l\'intervention'
                : 'Renseignez les informations de la nouvelle intervention'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-1 flex-col gap-6 py-4 min-h-0 overflow-y-auto">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-4">
              {/* Titre */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Titre de l'intervention"
                  required
                  className="mt-1.5"
                />
              </div>

              {/* Client */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="client_id">Client *</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(value) => handleChange('client_id', value)}
                  disabled={isLoadingClients}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        {isLoadingClients ? 'Chargement...' : 'Aucun client disponible'}
                      </div>
                    ) : (
                      clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.first_name} {client.last_name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Date et Statut */}
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex-1 min-w-0">
                  <Label>Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal mt-1.5"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? (
                          format(selectedDate, 'PPP', { locale: fr })
                        ) : (
                          <span className="text-muted-foreground">Sélectionner une date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date)
                          if (date) {
                            handleChange('date_intervention', date.toISOString().split('T')[0])
                          }
                        }}
                        initialFocus
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex-1 min-w-0">
                  <Label htmlFor="status">Statut</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleChange('status', value as typeof formData.status)}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prevu">Prévu</SelectItem>
                      <SelectItem value="en_cours">En cours</SelectItem>
                      <SelectItem value="termine">Terminé</SelectItem>
                      <SelectItem value="annule">Annulé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Montant estimé */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="estimated_amount">Montant estimé (€)</Label>
                <Input
                  id="estimated_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.estimated_amount}
                  onChange={(e) => handleChange('estimated_amount', e.target.value)}
                  placeholder="0.00"
                  className="mt-1.5"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => {
                    handleChange('description', e.target.value)
                    // Auto-resize
                    e.target.style.height = 'auto'
                    e.target.style.height = `${e.target.scrollHeight}px`
                  }}
                  placeholder="Description de l'intervention"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none overflow-hidden"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-row gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isLoadingClients}
            >
              {isSubmitting ? 'Enregistrement...' : intervention ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
