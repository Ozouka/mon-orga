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
import { CalendarIcon, Plus, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Separator } from '@/components/ui/separator'

interface Client {
  id: string
  first_name: string
  last_name: string
}

interface Intervention {
  id: string
  title: string
}

interface DevisItem {
  id?: string
  reference: string
  description: string
  quantity: number
  unit_price: number
  unit: string
  total_ht: number
}

interface Devis {
  id: string
  number: string
  created_at: string
  total_ht: number
  total_ttc: number
  status: 'en_attente' | 'accepte' | 'refuse'
  client_id: string
  intervention_id: string | null
  items?: DevisItem[]
}

interface DevisFormModalProps {
  open: boolean
  onClose: () => void
  devis?: Devis | null
}

export function DevisFormModal({ open, onClose, devis }: DevisFormModalProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [isLoadingClients, setIsLoadingClients] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  
  const [formData, setFormData] = useState({
    number: '',
    created_at: '',
    total_ht: '',
    total_ttc: '',
    status: 'en_attente' as 'en_attente' | 'accepte' | 'refuse',
    client_id: '',
    intervention_id: '',
  })

  const [items, setItems] = useState<DevisItem[]>([])
  const [selectedDateCreation, setSelectedDateCreation] = useState<Date | undefined>(undefined)

  // Charger les clients
  useEffect(() => {
    if (open) {
      loadClients()
    }
  }, [open])

  // Charger les interventions quand un client est sélectionné
  useEffect(() => {
    if (selectedClientId && open) {
      loadInterventions(selectedClientId)
    } else {
      setInterventions([])
    }
  }, [selectedClientId, open])

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

  const loadInterventions = async (clientId: string) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Utilisateur non connecté')
      }

      const { data, error } = await supabase
        .from('interventions')
        .select('id, title')
        .eq('user_id', user.id)
        .eq('client_id', clientId)
        .order('date_intervention', { ascending: false })

      if (error) throw error
      setInterventions(data || [])
    } catch (err) {
      console.error('Erreur lors du chargement des interventions:', err)
    }
  }

  // Charger les lignes du devis
  useEffect(() => {
    const loadItems = async () => {
      if (devis?.id && open) {
        try {
          const supabase = createClient()
          const { data: { user } } = await supabase.auth.getUser()

          if (!user) return

          const { data: itemsData, error } = await supabase
            .from('devis_items')
            .select('*')
            .eq('devis_id', devis.id)
            .order('created_at', { ascending: true })

          if (error) {
            console.error('Erreur lors du chargement des lignes:', error)
            return
          }

          setItems(
            itemsData?.map((item) => ({
              id: item.id,
              reference: item.reference || '',
              description: item.description || '',
              quantity: Number(item.quantity) || 0,
              unit_price: Number(item.unit_price) || 0,
              unit: item.unit || 'U',
              total_ht: Number(item.total_ht) || 0,
            })) || []
          )
        } catch (err) {
          console.error('Erreur lors du chargement des lignes:', err)
        }
      } else if (!devis && open) {
        setItems([])
      }
    }

    loadItems()
  }, [devis?.id, open])

  // Initialiser le formulaire
  useEffect(() => {
    if (devis) {
      const dateCreation = devis.created_at ? new Date(devis.created_at) : undefined
      setSelectedDateCreation(dateCreation)
      setSelectedClientId(devis.client_id)
      setFormData({
        number: devis.number || '',
        created_at: devis.created_at ? devis.created_at.split('T')[0] : '',
        total_ht: devis.total_ht ? devis.total_ht.toString() : '',
        total_ttc: devis.total_ttc ? devis.total_ttc.toString() : '',
        status: devis.status || 'en_attente',
        client_id: devis.client_id || '',
        intervention_id: devis.intervention_id || '',
      })
    } else {
      const today = new Date()
      setSelectedDateCreation(today)
      const todayStr = today.toISOString().split('T')[0]
      setSelectedClientId('')
      setFormData({
        number: '',
        created_at: todayStr,
        total_ht: '',
        total_ttc: '',
        status: 'en_attente',
        client_id: '',
        intervention_id: '',
      })
      setItems([])
    }
    setError(null)
  }, [devis, open])

  // Calculer les totaux depuis les lignes
  useEffect(() => {
    if (items.length > 0) {
      const totalHT = items.reduce((sum, item) => sum + item.total_ht, 0)
      const totalTTC = totalHT * 1.2 // TVA 20% par défaut
      setFormData((prev) => ({
        ...prev,
        total_ht: totalHT.toFixed(2),
        total_ttc: totalTTC.toFixed(2),
      }))
    }
  }, [items])


  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
    
    // Si le client change, réinitialiser l'intervention
    if (field === 'client_id') {
      setSelectedClientId(value)
      setFormData((prev) => ({ ...prev, intervention_id: '' }))
    }
  }

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        reference: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        unit: 'U',
        total_ht: 0,
      },
    ])
  }

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: keyof DevisItem, value: string | number) => {
    setItems((prev) => {
      const newItems = [...prev]
      const item = { ...newItems[index], [field]: value }

      // Recalculer total_ht si quantity ou unit_price change
      if (field === 'quantity' || field === 'unit_price') {
        item.total_ht = Number(item.quantity) * Number(item.unit_price)
      }

      newItems[index] = item
      return newItems
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    // Validation
    if (!formData.number.trim()) {
      setError('Le numéro de devis est obligatoire')
      setIsSubmitting(false)
      return
    }

    if (!formData.client_id) {
      setError('Le client est obligatoire')
      setIsSubmitting(false)
      return
    }

    if (!formData.created_at) {
      setError('La date de création est obligatoire')
      setIsSubmitting(false)
      return
    }

    // Validation des lignes
    if (items.length === 0) {
      setError('Au moins une ligne est requise')
      setIsSubmitting(false)
      return
    }

    const invalidItems = items.filter(
      (item) => !item.reference.trim() || item.quantity <= 0 || item.unit_price <= 0
    )
    if (invalidItems.length > 0) {
      setError('Toutes les lignes doivent avoir une référence, une quantité et un prix unitaire valides')
      setIsSubmitting(false)
      return
    }

    // Calculer les totaux depuis les lignes
    const totalHT = items.reduce((sum, item) => sum + item.total_ht, 0)
    const totalTTC = totalHT * 1.2 // TVA 20% par défaut

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Utilisateur non connecté')
      }

      const devisData = {
        number: formData.number.trim(),
        created_at: formData.created_at,
        total_ht: totalHT,
        total_ttc: totalTTC,
        status: formData.status,
        client_id: formData.client_id,
        intervention_id: formData.intervention_id || null,
        user_id: user.id,
      }

      let devisId: string

      if (devis) {
        // Mode édition
        const { error: updateError } = await supabase
          .from('devis')
          .update(devisData)
          .eq('id', devis.id)
          .eq('user_id', user.id)
          .select('id')
          .single()

        if (updateError) throw updateError
        devisId = devis.id

        // Supprimer les anciennes lignes
        const { error: deleteError } = await supabase
          .from('devis_items')
          .delete()
          .eq('devis_id', devis.id)

        if (deleteError) throw deleteError
      } else {
        // Mode création
        const { data: newDevis, error: insertError } = await supabase
          .from('devis')
          .insert(devisData)
          .select('id')
          .single()

        if (insertError) throw insertError
        devisId = newDevis.id
      }

      // Insérer les nouvelles lignes
      const itemsToInsert = items.map((item) => ({
        devis_id: devisId,
        reference: item.reference.trim(),
        description: item.description.trim() || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        unit: item.unit,
        total_ht: item.total_ht,
      }))

      if (itemsToInsert.length > 0) {
        const { error: itemsError } = await supabase
          .from('devis_items')
          .insert(itemsToInsert)

        if (itemsError) throw itemsError
      }

      toast.success(devis ? 'Devis modifié avec succès' : 'Devis créé avec succès', {
        description: `${formData.number} a été ${devis ? 'modifié' : 'ajouté'}`,
        style: {
          color: '#22c55e',
        },
        classNames: {
          title: '!text-green-500',
          description: '!text-green-500',
        },
      })

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
              {devis ? 'Modifier le devis' : 'Créer un devis'}
            </DialogTitle>
            <DialogDescription>
              {devis
                ? 'Modifiez les informations du devis'
                : 'Renseignez les informations du nouveau devis'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-1 flex-col gap-6 py-4 min-h-0 overflow-y-auto">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-4">
              {/* Numéro de devis */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="number">Numéro de devis *</Label>
                <Input
                  id="number"
                  value={formData.number}
                  onChange={(e) => handleChange('number', e.target.value)}
                  placeholder="DEV-2024-001"
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

              {/* Intervention (optionnel) */}
              {formData.client_id && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="intervention_id">Intervention (optionnel)</Label>
                  <Select
                    value={formData.intervention_id}
                    onValueChange={(value) => handleChange('intervention_id', value)}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Sélectionner une intervention" />
                    </SelectTrigger>
                    <SelectContent>
                      {interventions.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          Aucune intervention disponible pour ce client
                        </div>
                      ) : (
                        <>
                          {interventions.map((intervention) => (
                            <SelectItem key={intervention.id} value={intervention.id}>
                              {intervention.title}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Date de création */}
              <div className="flex flex-col gap-1.5">
                <Label>Date de création *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal mt-1.5"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDateCreation ? (
                        format(selectedDateCreation, 'PPP', { locale: fr })
                      ) : (
                        <span className="text-muted-foreground">Sélectionner une date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDateCreation}
                      onSelect={(date) => {
                        setSelectedDateCreation(date)
                        if (date) {
                          handleChange('created_at', date.toISOString().split('T')[0])
                        }
                      }}
                      initialFocus
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Montants */}
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex-1 min-w-0">
                  <Label htmlFor="total_ht">Total HT (€) *</Label>
                  <Input
                    id="total_ht"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.total_ht}
                    onChange={(e) => handleChange('total_ht', e.target.value)}
                    placeholder="0.00"
                    required
                    className="mt-1.5"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <Label htmlFor="total_ttc">Total TTC (€) *</Label>
                  <Input
                    id="total_ttc"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.total_ttc}
                    onChange={(e) => handleChange('total_ttc', e.target.value)}
                    placeholder="0.00"
                    required
                    className="mt-1.5"
                  />
                </div>
              </div>

              {/* Statut */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="status">Statut</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange('status', value as typeof formData.status)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en_attente">En attente</SelectItem>
                    <SelectItem value="accepte">Accepté</SelectItem>
                    <SelectItem value="refuse">Refusé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Lignes */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Lignes</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddItem}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une ligne
                  </Button>
                </div>

                {items.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-4 text-center border rounded-md">
                    Aucune ligne. Cliquez sur &quot;Ajouter une ligne&quot; pour commencer.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="flex flex-col gap-3 p-3 border rounded-md"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0 text-sm font-medium">
                            Ligne {index + 1}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(index)}
                            className="shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex flex-col gap-3">
                          <div className="flex flex-col gap-1.5">
                            <Label className="text-xs">Référence *</Label>
                            <Input
                              value={item.reference}
                              onChange={(e) => handleItemChange(index, 'reference', e.target.value)}
                              placeholder="Ex: Pose parquet"
                              className="text-sm"
                            />
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <Label className="text-xs">Description</Label>
                            <Input
                              value={item.description}
                              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                              placeholder="Description détaillée"
                              className="text-sm"
                            />
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="flex flex-col gap-1.5">
                              <Label className="text-xs">Quantité *</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)
                                }
                                className="text-sm"
                              />
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <Label className="text-xs">Unité</Label>
                              <select
                                value={item.unit}
                                onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                <option value="U">U</option>
                                <option value="m²">m²</option>
                                <option value="ml">ml</option>
                                <option value="h">h</option>
                                <option value="kg">kg</option>
                              </select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <Label className="text-xs">Prix unitaire (€) *</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.unit_price}
                                onChange={(e) =>
                                  handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)
                                }
                                className="text-sm"
                              />
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <Label className="text-xs">Total HT (€)</Label>
                              <Input
                                value={item.total_ht.toFixed(2)}
                                disabled
                                className="text-sm bg-muted"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Totaux */}
              <div className="flex flex-col gap-2 p-3 bg-muted/50 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total HT:</span>
                  <span className="text-sm font-semibold">{formData.total_ht || '0.00'} €</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">TVA (20%):</span>
                  <span className="text-sm">
                    {((parseFloat(formData.total_ht) || 0) * 0.2).toFixed(2)} €
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-base font-semibold">Total TTC:</span>
                  <span className="text-base font-bold">{formData.total_ttc || '0.00'} €</span>
                </div>
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
              {isSubmitting ? 'Enregistrement...' : devis ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
