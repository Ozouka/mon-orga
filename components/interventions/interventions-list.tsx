'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { InterventionFormModal } from './intervention-form-modal'
import { Search, Plus, Calendar, MapPin, MoreVertical, Pencil, Trash2, Euro } from 'lucide-react'
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

interface InterventionsListProps {
  interventions: Intervention[]
}

const statusConfig = {
  prevu: { label: 'Prévu', variant: 'secondary' as const },
  en_cours: { label: 'En cours', variant: 'default' as const },
  termine: { label: 'Terminé', variant: 'outline' as const },
  annule: { label: 'Annulé', variant: 'destructive' as const },
}

// Fonction pour la normalisation des accents ex: création et creation deviennent la même chose
const normalizeString = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function InterventionsList({ interventions: initialInterventions }: InterventionsListProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'upcoming' | 'past'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingIntervention, setEditingIntervention] = useState<Intervention | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [interventionToDelete, setInterventionToDelete] = useState<Intervention | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState(false)

  const today = useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }, [])

  // Filtrer les interventions selon le type et la recherche
  const filteredInterventions = useMemo(() => {
    let filtered = initialInterventions

    // Filtrer par type (à venir / passées)
    if (filterType === 'upcoming') {
      filtered = filtered.filter((intervention) => {
        const interventionDate = new Date(intervention.date_intervention)
        interventionDate.setHours(0, 0, 0, 0)
        // À venir : date >= aujourd'hui ET (statut = "prévu" OU statut = "en_cours")
        return interventionDate >= today && (intervention.status === 'prevu' || intervention.status === 'en_cours')
      })
    } else if (filterType === 'past') {
      filtered = filtered.filter((intervention) => {
        const interventionDate = new Date(intervention.date_intervention)
        interventionDate.setHours(0, 0, 0, 0)
        return interventionDate < today || intervention.status === 'termine' || intervention.status === 'annule'
      })
    }

    if (searchQuery) {
      const normalizedQuery = normalizeString(searchQuery)
      filtered = filtered.filter((intervention) => {
        const fullName = normalizeString(`${intervention.client.first_name} ${intervention.client.last_name}`)
        const title = normalizeString(intervention.title)
        const description = normalizeString(intervention.description || '')
        const city = normalizeString(intervention.client.city || '')
        
        return fullName.includes(normalizedQuery) || title.includes(normalizedQuery) || description.includes(normalizedQuery) || city.includes(normalizedQuery)
      })
    }

    return filtered
  }, [initialInterventions, filterType, searchQuery, today])

  const handleCreateClick = () => {
    setEditingIntervention(null)
    setIsModalOpen(true)
  }

  const handleEditClick = (intervention: Intervention) => {
    setEditingIntervention(intervention)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingIntervention(null)
  }

  const handleDeleteClick = (intervention: Intervention) => {
    setInterventionToDelete(intervention)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!interventionToDelete) return

    setIsDeleting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Utilisateur non connecté')
      }

      const { error } = await supabase
        .from('interventions')
        .delete()
        .eq('id', interventionToDelete.id)
        .eq('user_id', user.id)

      if (error) throw error

      setDeleteSuccess(true)
      
      toast.success('Intervention supprimée avec succès', {
        description: `${interventionToDelete.title} a été supprimée`,
        style: {
          color: '#22c55e',
        },
        classNames: {
          title: '!text-green-500',
          description: '!text-green-500',
        },
      })

      setTimeout(() => {
        router.refresh()
        setDeleteDialogOpen(false)
        setInterventionToDelete(null)
        setDeleteSuccess(false)
      }, 1500)
    } catch (err) {
      console.error('Erreur lors de la suppression:', err)
      toast.error('Erreur lors de la suppression', {
        description: err instanceof Error ? err.message : 'Une erreur est survenue',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 shrink-0">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold">Interventions</h1>
            <Badge variant="secondary" className="text-sm">
              {filteredInterventions.length}
            </Badge>
          </div>
          <Button onClick={handleCreateClick} className="w-full sm:w-auto shrink-0">
            <Plus className="h-4 w-4" />
            Créer une intervention
          </Button>
        </div>

        {/* Filtres et recherche */}
        <div className="flex flex-col gap-3 sm:flex-row">
          {/* Filtres par type */}
          <div className="flex gap-2 shrink-0">
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('all')}
            >
              Toutes
            </Button>
            <Button
              variant={filterType === 'upcoming' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('upcoming')}
            >
              À venir
            </Button>
            <Button
              variant={filterType === 'past' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('past')}
            >
              Passées
            </Button>
          </div>

          {/* Barre de recherche */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher une intervention..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full"
            />
          </div>
        </div>
      </div>

      {/* Liste des interventions */}
      {filteredInterventions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-center">
              {searchQuery || filterType !== 'all'
                ? 'Aucune intervention trouvée'
                : 'Aucune intervention pour le moment'}
            </p>
            {!searchQuery && filterType === 'all' && (
              <Button onClick={handleCreateClick} variant="outline" className="mt-4">
                <Plus className="h-4 w-4" />
                Créer votre première intervention
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {/* En-têtes du tableau - Visible uniquement sur desktop */}
          <div className="hidden lg:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase">
            <div>Intervention</div>
            <div>Client</div>
            <div>Date</div>
            <div>Montant</div>
            <div></div>
          </div>

          {/* Liste des interventions */}
          {filteredInterventions.map((intervention) => {
            const interventionDate = new Date(intervention.date_intervention)

            return (
              <Card
                key={intervention.id}
                className="transition-colors hover:bg-accent cursor-pointer border"
                onClick={() => handleEditClick(intervention)}
              >
                <CardContent className="flex flex-col gap-3 p-4 sm:p-6">
                  {/* Mobile: Layout avec dropdown */}
                  <div className="flex flex-row gap-3 lg:hidden">
                    <div className="flex flex-col gap-3 flex-1 min-w-0">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-base">
                            {intervention.title}
                          </h3>
                          <Badge variant={statusConfig[intervention.status].variant} className="shrink-0">
                            {statusConfig[intervention.status].label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {intervention.client.first_name} {intervention.client.last_name}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 shrink-0" />
                          <span>
                            {format(interventionDate, 'd MMM yyyy', { locale: fr })}
                          </span>
                        </div>
                        {intervention.client.city && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 shrink-0" />
                            <span>{intervention.client.city}</span>
                          </div>
                        )}
                        {intervention.estimated_amount && (
                          <div className="flex items-center gap-1.5">
                            <Euro className="h-4 w-4 shrink-0" />
                            <span>{intervention.estimated_amount.toFixed(2)} €</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                            }}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditClick(intervention)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteClick(intervention)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Desktop: Layout en grille */}
                  <div className="hidden lg:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center">
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">
                          {intervention.title}
                        </h3>
                        <Badge variant={statusConfig[intervention.status].variant} className="shrink-0">
                          {statusConfig[intervention.status].label}
                        </Badge>
                      </div>
                      {intervention.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {intervention.description}
                        </p>
                      )}
                    </div>
                    <div className="text-sm min-w-0">
                      <div className="truncate">
                        {intervention.client.first_name} {intervention.client.last_name}
                      </div>
                      {intervention.client.city && (
                        <div className="text-xs text-muted-foreground truncate">
                          {intervention.client.city}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(interventionDate, 'd MMM yyyy', { locale: fr })}
                    </div>
                    {intervention.estimated_amount ? (
                      <div className="text-sm font-medium">
                        {intervention.estimated_amount.toFixed(2)} €
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">-</div>
                    )}
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                            }}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditClick(intervention)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteClick(intervention)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal de création/édition */}
      <InterventionFormModal
        open={isModalOpen}
        onClose={handleModalClose}
        intervention={editingIntervention}
      />

      {/* Alert Dialog de confirmation de suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteSuccess ? 'Suppression effectuée' : 'Supprimer l&apos;intervention'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteSuccess ? (
                <span style={{ color: '#22c55e', fontWeight: 500 }}>
                  L&apos;intervention{' '}
                  <strong>
                    {interventionToDelete?.title}
                  </strong>{' '}
                  a été supprimée avec succès.
                </span>
              ) : (
                <>
                  Êtes-vous sûr de vouloir supprimer l&apos;intervention{' '}
                  <strong>
                    {interventionToDelete?.title}
                  </strong>
                  ? Cette action est irréversible.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {!deleteSuccess && (
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </AlertDialogAction>
            </AlertDialogFooter>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
