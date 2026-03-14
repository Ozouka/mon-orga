'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { DevisFormModal } from './devis-form-modal'
import { FactureFormModal } from './facture-form-modal'
import { Search, Plus, MoreVertical, Pencil, Trash2, Euro, FileText, Calendar, Download, Eye } from 'lucide-react'
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

interface Devis {
  id: string
  number: string
  created_at: string
  total_ht: number
  total_ttc: number
  status: 'en_attente' | 'accepte' | 'refuse'
  client_id: string
  intervention_id: string | null
  client: Client
}

interface Facture {
  id: string
  number: string
  created_at: string
  date_echeance: string | null
  total_ht: number
  total_ttc: number
  status: 'impayee' | 'payee'
  paid_at: string | null
  client_id: string
  intervention_id: string | null
  devis_id: string | null
  client: Client
}

interface DevisFacturesListProps {
  devis: Devis[]
  factures: Facture[]
}

// Fonction pour la normalisation des accents ex: création et creation deviennent la même chose
const normalizeString = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

const devisStatusConfig = {
  en_attente: { label: 'En attente', variant: 'secondary' as const },
  accepte: { label: 'Accepté', variant: 'default' as const },
  refuse: { label: 'Refusé', variant: 'destructive' as const },
}

const factureStatusConfig = {
  impayee: { label: 'Impayée', variant: 'destructive' as const },
  payee: { label: 'Payée', variant: 'default' as const },
}

export function DevisFacturesList({ devis: initialDevis, factures: initialFactures }: DevisFacturesListProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'devis' | 'factures'>('devis')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | string>('all')
  
  // Modals devis
  const [isDevisModalOpen, setIsDevisModalOpen] = useState(false)
  const [editingDevis, setEditingDevis] = useState<Devis | null>(null)
  const [deleteDevisDialogOpen, setDeleteDevisDialogOpen] = useState(false)
  const [devisToDelete, setDevisToDelete] = useState<Devis | null>(null)
  const [isDeletingDevis, setIsDeletingDevis] = useState(false)
  const [deleteDevisSuccess, setDeleteDevisSuccess] = useState(false)

  // Modals factures
  const [isFactureModalOpen, setIsFactureModalOpen] = useState(false)
  const [editingFacture, setEditingFacture] = useState<Facture | null>(null)
  const [deleteFactureDialogOpen, setDeleteFactureDialogOpen] = useState(false)
  const [factureToDelete, setFactureToDelete] = useState<Facture | null>(null)
  const [isDeletingFacture, setIsDeletingFacture] = useState(false)
  const [deleteFactureSuccess, setDeleteFactureSuccess] = useState(false)

  // Filtrer les devis
  const filteredDevis = useMemo(() => {
    let filtered = initialDevis

    // Filtrer par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter((devis) => devis.status === statusFilter)
    }

    // Filtrer par recherche
    if (searchQuery) {
      const normalizedQuery = normalizeString(searchQuery)
      filtered = filtered.filter((devis) => {
        const numero = normalizeString(devis.number || '')
        const clientName = normalizeString(`${devis.client.first_name} ${devis.client.last_name}`)
        
        return numero.includes(normalizedQuery) || clientName.includes(normalizedQuery)
      })
    }

    return filtered
  }, [initialDevis, statusFilter, searchQuery])

  // Filtrer les factures
  const filteredFactures = useMemo(() => {
    let filtered = initialFactures

    // Filtrer par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter((facture) => facture.status === statusFilter)
    }

    // Filtrer par recherche
    if (searchQuery) {
      const normalizedQuery = normalizeString(searchQuery)
      filtered = filtered.filter((facture) => {
        const numero = normalizeString(facture.number || '')
        const clientName = normalizeString(`${facture.client.first_name} ${facture.client.last_name}`)
        
        return numero.includes(normalizedQuery) || clientName.includes(normalizedQuery)
      })
    }

    return filtered
  }, [initialFactures, statusFilter, searchQuery])

  // Handlers devis
  const handleCreateDevis = () => {
    setEditingDevis(null)
    setIsDevisModalOpen(true)
  }

  const handleEditDevis = (devis: Devis) => {
    setEditingDevis(devis)
    setIsDevisModalOpen(true)
  }

  const handleDeleteDevis = (devis: Devis) => {
    setDevisToDelete(devis)
    setDeleteDevisDialogOpen(true)
  }

  const handleDeleteDevisConfirm = async () => {
    if (!devisToDelete) return

    setIsDeletingDevis(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Utilisateur non connecté')
      }

      const { error } = await supabase
        .from('devis')
        .delete()
        .eq('id', devisToDelete.id)
        .eq('user_id', user.id)

      if (error) throw error

      setDeleteDevisSuccess(true)
      
      toast.success('Devis supprimé avec succès', {
        description: `${devisToDelete.number} a été supprimé`,
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
        setDeleteDevisDialogOpen(false)
        setDevisToDelete(null)
        setDeleteDevisSuccess(false)
      }, 1500)
    } catch (err) {
      console.error('Erreur lors de la suppression:', err)
      toast.error('Erreur lors de la suppression', {
        description: err instanceof Error ? err.message : 'Une erreur est survenue',
      })
    } finally {
      setIsDeletingDevis(false)
    }
  }

  // Handlers factures
  const handleCreateFacture = () => {
    setEditingFacture(null)
    setIsFactureModalOpen(true)
  }

  const handleEditFacture = (facture: Facture) => {
    setEditingFacture(facture)
    setIsFactureModalOpen(true)
  }

  const handleDeleteFacture = (facture: Facture) => {
    setFactureToDelete(facture)
    setDeleteFactureDialogOpen(true)
  }

  const handleDeleteFactureConfirm = async () => {
    if (!factureToDelete) return

    setIsDeletingFacture(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Utilisateur non connecté')
      }

      const { error } = await supabase
        .from('factures')
        .delete()
        .eq('id', factureToDelete.id)
        .eq('user_id', user.id)

      if (error) throw error

      setDeleteFactureSuccess(true)
      
      toast.success('Facture supprimée avec succès', {
        description: `${factureToDelete.number} a été supprimée`,
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
        setDeleteFactureDialogOpen(false)
        setFactureToDelete(null)
        setDeleteFactureSuccess(false)
      }, 1500)
    } catch (err) {
      console.error('Erreur lors de la suppression:', err)
      toast.error('Erreur lors de la suppression', {
        description: err instanceof Error ? err.message : 'Une erreur est survenue',
      })
    } finally {
      setIsDeletingFacture(false)
    }
  }

  const currentStatusOptions = activeTab === 'devis' 
    ? ['all', 'en_attente', 'accepte', 'refuse']
    : ['all', 'impayee', 'payee']

  const currentStatusConfig = activeTab === 'devis' ? devisStatusConfig : factureStatusConfig
  const currentItems = activeTab === 'devis' ? filteredDevis : filteredFactures

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 shrink-0">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold">Devis & Factures</h1>
            <Badge variant="secondary" className="text-sm">
              {currentItems.length}
            </Badge>
          </div>
          <Button 
            onClick={activeTab === 'devis' ? handleCreateDevis : handleCreateFacture} 
            className="w-full sm:w-auto shrink-0"
          >
            <Plus className="h-4 w-4" />
            {activeTab === 'devis' ? 'Créer un devis' : 'Créer une facture'}
          </Button>
        </div>

        {/* Onglets */}
        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value as 'devis' | 'factures')
          setStatusFilter('all')
          setSearchQuery('')
        }}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="devis">Devis</TabsTrigger>
            <TabsTrigger value="factures">Factures</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filtres et recherche */}
        <div className="flex flex-col gap-3 sm:flex-row">
          {/* Filtres par statut */}
          <div className="flex gap-2 shrink-0 flex-wrap">
            {currentStatusOptions.map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status === 'all' 
                  ? 'Tous' 
                  : currentStatusConfig[status as keyof typeof currentStatusConfig]?.label || status}
              </Button>
            ))}
          </div>

          {/* Barre de recherche */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={`Rechercher un ${activeTab === 'devis' ? 'devis' : 'facture'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full"
            />
          </div>
        </div>
      </div>

      {/* Contenu des onglets */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'devis' | 'factures')}>
        {/* Onglet Devis */}
        <TabsContent value="devis" className="flex flex-col gap-3">
          {filteredDevis.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground text-center">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Aucun devis trouvé'
                    : 'Aucun devis pour le moment'}
                </p>
                {!searchQuery && statusFilter === 'all' && (
                  <Button onClick={handleCreateDevis} variant="outline" className="mt-4">
                    <Plus className="h-4 w-4" />
                    Créer votre premier devis
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              {/* En-têtes du tableau - Desktop */}
              <div className="hidden lg:grid grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase">
                <div>Devis</div>
                <div>Client</div>
                <div>Date</div>
                <div>Montant</div>
                <div></div>
              </div>

              {/* Liste des devis */}
              {filteredDevis.map((devis) => (
                <Card
                  key={devis.id}
                  className="transition-colors hover:bg-accent cursor-pointer border"
                  onClick={() => handleEditDevis(devis)}
                >
                  <CardContent className="flex flex-col gap-3 p-4 sm:p-6">
                    {/* Mobile */}
                    <div className="flex flex-row gap-3 lg:hidden">
                      <div className="flex flex-col gap-3 flex-1 min-w-0">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-base">
                              {devis.number}
                            </h3>
                            <Badge variant={devisStatusConfig[devis.status].variant} className="shrink-0">
                              {devisStatusConfig[devis.status].label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {devis.client.first_name} {devis.client.last_name}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 shrink-0" />
                            <span>
                              {format(new Date(devis.created_at), 'd MMM yyyy', { locale: fr })}
                            </span>
                          </div>
                          {devis.total_ttc && (
                            <div className="flex items-center gap-1.5">
                              <Euro className="h-4 w-4 shrink-0" />
                              <span>{devis.total_ttc.toFixed(2)} €</span>
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
                                window.open(`/api/devis/${devis.id}/pdf?preview=true`, '_blank')
                              }}
                            >
                              <Eye className="h-4 w-4" />
                              Prévisualiser PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                window.open(`/api/devis/${devis.id}/pdf`, '_blank')
                              }}
                            >
                              <Download className="h-4 w-4" />
                              Télécharger PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditDevis(devis)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteDevis(devis)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Desktop */}
                    <div className="hidden lg:grid grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-4 items-center">
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">
                            {devis.number}
                          </h3>
                          <Badge variant={devisStatusConfig[devis.status].variant} className="shrink-0">
                            {devisStatusConfig[devis.status].label}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-sm min-w-0">
                        <div className="truncate">
                          {devis.client.first_name} {devis.client.last_name}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(devis.created_at), 'd MMM yyyy', { locale: fr })}
                      </div>
                      {devis.total_ttc ? (
                        <div className="text-sm font-medium">
                          {devis.total_ttc.toFixed(2)} €
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
                                window.open(`/api/devis/${devis.id}/pdf?preview=true`, '_blank')
                              }}
                            >
                              <Eye className="h-4 w-4" />
                              Prévisualiser PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                window.open(`/api/devis/${devis.id}/pdf`, '_blank')
                              }}
                            >
                              <Download className="h-4 w-4" />
                              Télécharger PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditDevis(devis)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteDevis(devis)
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
            </>
          )}
        </TabsContent>

        {/* Onglet Factures */}
        <TabsContent value="factures" className="flex flex-col gap-3">
          {filteredFactures.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground text-center">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Aucune facture trouvée'
                    : 'Aucune facture pour le moment'}
                </p>
                {!searchQuery && statusFilter === 'all' && (
                  <Button onClick={handleCreateFacture} variant="outline" className="mt-4">
                    <Plus className="h-4 w-4" />
                    Créer votre première facture
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              {/* En-têtes du tableau - Desktop */}
              <div className="hidden lg:grid grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase">
                <div>Facture</div>
                <div>Client</div>
                <div>Date</div>
                <div>Montant</div>
                <div></div>
              </div>

              {/* Liste des factures */}
              {filteredFactures.map((facture) => (
                <Card
                  key={facture.id}
                  className="transition-colors hover:bg-accent cursor-pointer border"
                  onClick={() => handleEditFacture(facture)}
                >
                  <CardContent className="flex flex-col gap-3 p-4 sm:p-6">
                    {/* Mobile */}
                    <div className="flex flex-row gap-3 lg:hidden">
                      <div className="flex flex-col gap-3 flex-1 min-w-0">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-base">
                              {facture.number}
                            </h3>
                            <Badge variant={factureStatusConfig[facture.status].variant} className="shrink-0">
                              {factureStatusConfig[facture.status].label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {facture.client.first_name} {facture.client.last_name}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 shrink-0" />
                            <span>
                              {format(new Date(facture.created_at), 'd MMM yyyy', { locale: fr })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Euro className="h-4 w-4 shrink-0" />
                            <span>{facture.total_ttc.toFixed(2)} €</span>
                          </div>
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
                                window.open(`/api/factures/${facture.id}/pdf?preview=true`, '_blank')
                              }}
                            >
                              <Eye className="h-4 w-4" />
                              Prévisualiser PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                window.open(`/api/factures/${facture.id}/pdf`, '_blank')
                              }}
                            >
                              <Download className="h-4 w-4" />
                              Télécharger PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditFacture(facture)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteFacture(facture)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Desktop */}
                    <div className="hidden lg:grid grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-4 items-center">
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">
                            {facture.number}
                          </h3>
                          <Badge variant={factureStatusConfig[facture.status].variant} className="shrink-0">
                            {factureStatusConfig[facture.status].label}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-sm min-w-0">
                        <div className="truncate">
                          {facture.client.first_name} {facture.client.last_name}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(facture.created_at), 'd MMM yyyy', { locale: fr })}
                      </div>
                      <div className="text-sm font-medium">
                        {facture.total_ttc.toFixed(2)} €
                      </div>
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
                                window.open(`/api/factures/${facture.id}/pdf?preview=true`, '_blank')
                              }}
                            >
                              <Eye className="h-4 w-4" />
                              Prévisualiser PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                window.open(`/api/factures/${facture.id}/pdf`, '_blank')
                              }}
                            >
                              <Download className="h-4 w-4" />
                              Télécharger PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditFacture(facture)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteFacture(facture)
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
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <DevisFormModal
        open={isDevisModalOpen}
        onClose={() => {
          setIsDevisModalOpen(false)
          setEditingDevis(null)
        }}
        devis={editingDevis}
      />

      <FactureFormModal
        open={isFactureModalOpen}
        onClose={() => {
          setIsFactureModalOpen(false)
          setEditingFacture(null)
        }}
        facture={editingFacture}
      />

      {/* Alert Dialogs */}
      <AlertDialog open={deleteDevisDialogOpen} onOpenChange={setDeleteDevisDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteDevisSuccess ? 'Suppression effectuée' : 'Supprimer le devis'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDevisSuccess ? (
                <span style={{ color: '#22c55e', fontWeight: 500 }}>
                  Le devis{' '}
                  <strong>
                    {devisToDelete?.number}
                  </strong>{' '}
                  a été supprimé avec succès.
                </span>
              ) : (
                <>
                  Êtes-vous sûr de vouloir supprimer le devis{' '}
                  <strong>
                    {devisToDelete?.number}
                  </strong>
                  ? Cette action est irréversible.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {!deleteDevisSuccess && (
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeletingDevis}>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteDevisConfirm}
                disabled={isDeletingDevis}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeletingDevis ? 'Suppression...' : 'Supprimer'}
              </AlertDialogAction>
            </AlertDialogFooter>
          )}
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteFactureDialogOpen} onOpenChange={setDeleteFactureDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteFactureSuccess ? 'Suppression effectuée' : 'Supprimer la facture'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteFactureSuccess ? (
                <span style={{ color: '#22c55e', fontWeight: 500 }}>
                  La facture{' '}
                  <strong>
                    {factureToDelete?.number}
                  </strong>{' '}
                  a été supprimée avec succès.
                </span>
              ) : (
                <>
                  Êtes-vous sûr de vouloir supprimer la facture{' '}
                  <strong>
                    {factureToDelete?.number}
                  </strong>
                  ? Cette action est irréversible.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {!deleteFactureSuccess && (
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeletingFacture}>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteFactureConfirm}
                disabled={isDeletingFacture}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeletingFacture ? 'Suppression...' : 'Supprimer'}
              </AlertDialogAction>
            </AlertDialogFooter>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
