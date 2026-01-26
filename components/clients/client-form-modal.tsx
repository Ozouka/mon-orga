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

interface Client {
  id: string
  first_name: string
  last_name: string
  phone: string
  address: string | null
  city: string | null
}

interface ClientFormModalProps {
  open: boolean
  onClose: () => void
  client?: Client | null
}

export function ClientFormModal({ open, onClose, client }: ClientFormModalProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    city: '',
  })

  // Initialiser le formulaire avec les données du client si en mode édition
  useEffect(() => {
    if (client) {
      setFormData({
        first_name: client.first_name || '',
        last_name: client.last_name || '',
        phone: client.phone || '',
        address: client.address || '',
        city: client.city || '',
      })
    } else {
      // Réinitialiser le formulaire pour la création
      setFormData({
        first_name: '',
        last_name: '',
        phone: '',
        address: '',
        city: '',
      })
    }
    setError(null)
  }, [client, open])

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    // Validation
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setError('Le prénom et le nom sont obligatoires')
      setIsSubmitting(false)
      return
    }

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Utilisateur non connecté')
      }

      if (client) {
        // Mode édition
        const { error } = await supabase
          .from('clients')
          .update({
            first_name: formData.first_name.trim(),
            last_name: formData.last_name.trim(),
            phone: formData.phone.trim() || null,
            address: formData.address.trim() || null,
            city: formData.city.trim() || null,
          })
          .eq('id', client.id)
          .eq('user_id', user.id)

        if (error) throw error

        toast.success('Client modifié avec succès', {
          description: `${formData.first_name} ${formData.last_name} a été modifié`,
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
          .from('clients')
          .insert({
            user_id: user.id,
            first_name: formData.first_name.trim(),
            last_name: formData.last_name.trim(),
            phone: formData.phone.trim() || null,
            address: formData.address.trim() || null,
            city: formData.city.trim() || null,
          })

        if (error) throw error

        toast.success('Client créé avec succès', {
          description: `${formData.first_name} ${formData.last_name} a été ajouté`,
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
              {client ? 'Modifier le client' : 'Créer un client'}
            </DialogTitle>
            <DialogDescription>
              {client
                ? 'Modifiez les informations du client'
                : 'Renseignez les informations du nouveau client'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-1 flex-col gap-6 py-4 min-h-0 overflow-y-auto">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-4">
              {/* Prénom et Nom */}
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex-1 min-w-0">
                  <Label htmlFor="first_name">Prénom *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleChange('first_name', e.target.value)}
                    placeholder="Prénom"
                    required
                    className="mt-1.5"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <Label htmlFor="last_name">Nom *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleChange('last_name', e.target.value)}
                    placeholder="Nom"
                    required
                    className="mt-1.5"
                  />
                </div>
              </div>

              {/* Téléphone */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="Téléphone"
                  className="mt-1.5"
                />
              </div>

              {/* Adresse */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Adresse"
                  className="mt-1.5"
                />
              </div>

              {/* Ville */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="Ville"
                  className="mt-1.5"
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
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enregistrement...' : client ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
