'use client'

import { useState } from 'react'
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
import { ClientFormModal } from './client-form-modal'
import { Search, Plus, Phone, MapPin, MoreVertical, Pencil, Trash2 } from 'lucide-react'

interface Client {
  id: string
  first_name: string
  last_name: string
  phone: string
  address: string | null
  city: string | null
}

interface ClientsListProps {
  clients: Client[]
}

export function ClientsList({ clients: initialClients }: ClientsListProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState(false)

  const filteredClients = initialClients.filter((client) => {
    const fullName = `${client.first_name} ${client.last_name}`.toLowerCase()
    const phone = client.phone?.toLowerCase() || ''
    const city = client.city?.toLowerCase() || ''
    const query = searchQuery.toLowerCase()
    
    return fullName.includes(query) || phone.includes(query) || city.includes(query)
  })

  const handleCreateClick = () => {
    setEditingClient(null)
    setIsModalOpen(true)
  }

  const handleEditClick = (client: Client) => {
    setEditingClient(client)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingClient(null)
  }

  const handleDeleteClick = (client: Client) => {
    setClientToDelete(client)
    setDeleteDialogOpen(true)
    setDeleteSuccess(false)
  }

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return

    setIsDeleting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Utilisateur non connecté')
      }

      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientToDelete.id)
        .eq('user_id', user.id)

      if (error) throw error

      setDeleteSuccess(true)
      
      toast.success('Client supprimé avec succès', {
        description: `${clientToDelete.first_name} ${clientToDelete.last_name} a été supprimé`,
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
        setClientToDelete(null)
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
            <h1 className="text-2xl sm:text-3xl font-bold">Clients</h1>
            <Badge variant="secondary" className="text-sm">
              {filteredClients.length}
            </Badge>
          </div>
          <Button onClick={handleCreateClick} className="w-full sm:w-auto shrink-0">
            <Plus className="h-4 w-4" />
            Créer un client
          </Button>
        </div>

        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher un client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full"
          />
        </div>
      </div>

      {/* Liste des clients */}
      {filteredClients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-center">
              {searchQuery ? 'Aucun client trouvé' : 'Aucun client pour le moment'}
            </p>
            {!searchQuery && (
              <Button onClick={handleCreateClick} variant="outline" className="mt-4">
                <Plus className="h-4 w-4" />
                Créer votre premier client
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {/* En-têtes du tableau - Visible uniquement sur desktop */}
          <div className="hidden lg:grid grid-cols-[2fr_1fr_1fr_auto] gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase">
            <div>Client</div>
            <div>Téléphone</div>
            <div>Ville</div>
            <div></div>
          </div>

          {/* Liste des clients */}
          {filteredClients.map((client) => (
            <Card
              key={client.id}
              className="transition-colors hover:bg-accent cursor-pointer border"
              onClick={() => handleEditClick(client)}
            >
              <CardContent className="flex flex-col gap-3 p-4 sm:p-6">
                {/* Mobile: Layout avec dropdown */}
                <div className="flex flex-row gap-3 lg:hidden">
                  <div className="flex flex-col gap-3 flex-1 min-w-0">
                    <div className="flex flex-col gap-1">
                      <h3 className="font-semibold text-base">
                        {client.first_name} {client.last_name}
                      </h3>
                    </div>
                    {client.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4 shrink-0" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {client.city && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span>{client.city}</span>
                      </div>
                    )}
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
                            handleEditClick(client)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteClick(client)
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
                <div className="hidden lg:grid grid-cols-[2fr_1fr_1fr_auto] gap-4 items-center">
                  <div className="flex flex-col gap-1 min-w-0">
                    <h3 className="font-semibold truncate">
                      {client.first_name} {client.last_name}
                    </h3>
                  </div>
                  {client.phone ? (
                    <div className="text-sm text-muted-foreground truncate">
                      {client.phone}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">-</div>
                  )}
                  {client.city ? (
                    <div className="text-sm text-muted-foreground truncate">
                      {client.city}
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
                            handleEditClick(client)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteClick(client)
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
          ))}
        </div>
      )}

      {/* Modal de création/édition */}
      <ClientFormModal
        open={isModalOpen}
        onClose={handleModalClose}
        client={editingClient}
      />

      {/* Alert Dialog de confirmation de suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteSuccess ? 'Suppression effectuée' : 'Supprimer le client'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteSuccess ? (
                <span style={{ color: '#22c55e', fontWeight: 500 }}>
                  Le client{' '}
                  <strong>
                    {clientToDelete?.first_name} {clientToDelete?.last_name}
                  </strong>{' '}
                  a été supprimé avec succès.
                </span>
              ) : (
                <>
                  Êtes-vous sûr de vouloir supprimer{' '}
                  <strong>
                    {clientToDelete?.first_name} {clientToDelete?.last_name}
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
