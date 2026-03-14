'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/ui/dropzone'
import { useSupabaseUpload } from '@/hooks/use-supabase-upload'
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
import { Loader2 } from 'lucide-react'
import Image from 'next/image'

interface UserData {
  first_name: string
  last_name: string
  phone: string
  company_name: string
  activity_type: string
  address: string
  postal_code: string
  city: string
  country: string
  logo_url: string | null
  siret: string | null
  vat_number: string | null
  currency: string
  rcs: string | null
  code_ape: string | null
  capital: number | null
}

interface SettingsFormProps {
  userData: UserData | null
  userEmail: string
}

export function SettingsForm({ userData, userEmail }: SettingsFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(userData?.logo_url || null)
  const [email, setEmail] = useState(userEmail)
  const [showEmailAlert, setShowEmailAlert] = useState(false)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)
  const [uploadedLogoUrl, setUploadedLogoUrl] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    // Section 1: Données personnelles
    firstName: userData?.first_name || '',
    lastName: userData?.last_name || '',
    phone: userData?.phone || '',
    // Section 2: Informations entreprise
    companyName: userData?.company_name || '',
    activityType: userData?.activity_type || '',
    address: userData?.address || '',
    postalCode: userData?.postal_code || '',
    city: userData?.city || '',
    country: userData?.country || 'France',
    // Section 3: Informations légales
    siret: userData?.siret || '',
    vatNumber: userData?.vat_number || '',
    currency: userData?.currency || 'EUR',
    rcs: userData?.rcs || '',
    codeApe: userData?.code_ape || '',
    capital: userData?.capital?.toString() || '',
  })

  // Dropzone pour le logo
  const dropzoneProps = useSupabaseUpload({
    bucketName: 'logos',
    path: null, // Le path sera construit automatiquement comme `${user.id}/...`
    allowedMimeTypes: ['image/*'],
    maxFiles: 1,
    maxFileSize: 1000 * 1000 * 5, // 5MB
    onUploadComplete: async (urls) => {
      if (urls.length > 0) {
        const newLogoUrl = urls[0]
        setUploadedLogoUrl(newLogoUrl)
        setLogoUrl(newLogoUrl)

        // Sauvegarder automatiquement dans la BDD
        try {
          const supabase = createClient()
          const { data: { user } } = await supabase.auth.getUser()

          if (!user) {
            throw new Error('Utilisateur non connecté')
          }

          const { error: updateError } = await supabase
            .from('user_data')
            .upsert(
              {
                user_id: user.id,
                logo_url: newLogoUrl,
                company_name: formData.companyName.trim() || '',
                activity_type: formData.activityType || 'autre',
              },
              {
                onConflict: 'user_id',
              }
            )

          if (updateError) {
            throw updateError
          }

          toast.success('Logo uploadé et sauvegardé avec succès', {
            style: { color: '#22c55e' },
            classNames: {
              title: '!text-green-500',
            },
          })

          // Rafraîchir la page pour mettre à jour les données
          router.refresh()
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la sauvegarde en base de données'
          console.error('Erreur lors de la sauvegarde du logo:', error)
          toast.error('Erreur', {
            description: errorMessage,
          })
        }
      }
    },
  })

  // Réinitialiser les fichiers après upload réussi
  useEffect(() => {
    if (uploadedLogoUrl && dropzoneProps.isSuccess && dropzoneProps.files.length > 0) {
      // Petit délai pour laisser le temps à l'utilisateur de voir le succès
      const timer = setTimeout(() => {
        dropzoneProps.setFiles([])
      }, 1500)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedLogoUrl, dropzoneProps.isSuccess, dropzoneProps.files.length])

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleEmailChange = (newEmail: string) => {
    setEmail(newEmail)
    setError(null)
    // Si l'email a changé et est différent de l'email initial, on stocke la nouvelle valeur
    if (newEmail !== userEmail && newEmail.trim() !== '') {
      setPendingEmail(newEmail.trim())
    } else {
      setPendingEmail(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Si l'email a changé, afficher l'alerte avant de continuer
    if (pendingEmail && pendingEmail !== userEmail) {
      setShowEmailAlert(true)
      return
    }

    await saveSettings()
  }

  const saveSettings = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Utilisateur non connecté')
      }

      // Mettre à jour l'email si nécessaire
      if (pendingEmail && pendingEmail !== userEmail) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: pendingEmail,
        })

        if (emailError) {
          throw new Error(`Erreur lors de la mise à jour de l'email: ${emailError.message}`)
        }

        toast.success('Email mis à jour', {
          description: 'Un email de confirmation a été envoyé à votre nouvelle adresse',
          style: { color: '#22c55e' },
          classNames: {
            title: '!text-green-500',
          },
        })
      }

      const { error: updateError } = await supabase
        .from('user_data')
        .upsert(
          {
            user_id: user.id,
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
            phone: formData.phone.trim(),
            company_name: formData.companyName.trim(),
            activity_type: formData.activityType,
            address: formData.address.trim(),
            postal_code: formData.postalCode.trim(),
            city: formData.city.trim(),
            country: formData.country.trim(),
            logo_url: logoUrl,
            siret: formData.siret.trim() || null,
            vat_number: formData.vatNumber.trim() || null,
            currency: formData.currency,
            rcs: formData.rcs.trim() || null,
            code_ape: formData.codeApe.trim() || null,
            capital: formData.capital ? parseFloat(formData.capital) : null,
          },
          {
            onConflict: 'user_id',
          }
        )

      if (updateError) throw updateError

      toast.success('Paramètres sauvegardés avec succès', {
        style: { color: '#22c55e' },
        classNames: {
          title: '!text-green-500',
        },
      })

      setPendingEmail(null)
      router.refresh()
    } catch (err: unknown) {
      console.error('Erreur lors de la sauvegarde:', err)
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue lors de la sauvegarde'
      setError(errorMessage)
      toast.error('Erreur', {
        description: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
      setShowEmailAlert(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Section 1: Données personnelles */}
      <Card>
        <CardHeader>
          <CardTitle>Données personnelles</CardTitle>
          <CardDescription>Modifiez vos informations personnelles</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 min-w-0">
              <Label htmlFor="firstName">Prénom *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                placeholder="Jean"
                required
                className="mt-1.5"
              />
            </div>
            <div className="flex-1 min-w-0">
              <Label htmlFor="lastName">Nom *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                placeholder="Dupont"
                required
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="votre@email.com"
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground">
              {email !== userEmail
                ? '⚠️ Modifier l\'email changera votre adresse de connexion. Vous devrez confirmer la nouvelle adresse par email.'
                : 'Votre adresse email de connexion'}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Téléphone *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="06 12 34 56 78"
              required
              className="mt-1.5"
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Informations entreprise */}
      <Card>
        <CardHeader>
          <CardTitle>Informations entreprise</CardTitle>
          <CardDescription>Renseignez les informations de votre entreprise</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="companyName">Nom de l&apos;entreprise *</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              placeholder="Ex: Plomberie Martin"
              required
              className="mt-1.5"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="activityType">Type d&apos;activité *</Label>
            <select
              id="activityType"
              value={formData.activityType}
              onChange={(e) => handleChange('activityType', e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mt-1.5"
              required
            >
              <option value="">Sélectionnez un type</option>
              <option value="plombier">Plombier</option>
              <option value="carrossier">Carrossier</option>
              <option value="electricien">Électricien</option>
              <option value="independant">Indépendant</option>
              <option value="autre">Autre</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="address">Adresse *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Ex: 123 Rue de la République"
              required
              className="mt-1.5"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 min-w-0">
              <Label htmlFor="postalCode">Code postal *</Label>
              <Input
                id="postalCode"
                value={formData.postalCode}
                onChange={(e) => handleChange('postalCode', e.target.value)}
                placeholder="75001"
                required
                className="mt-1.5"
              />
            </div>
            <div className="flex-1 min-w-0">
              <Label htmlFor="city">Ville *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="Paris"
                required
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="country">Pays *</Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => handleChange('country', e.target.value)}
              placeholder="France"
              required
              className="mt-1.5"
            />
          </div>

          <Separator />

          {/* Upload de logo */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Logo de l&apos;entreprise</Label>
              
              {/* Affichage des logos : actuel sauvegardé + nouveau sélectionné */}
              {(logoUrl || (dropzoneProps.files.length > 0 && dropzoneProps.files[0].preview)) && (
                <div className="flex flex-col gap-3 mb-4">
                  {/* Logo sauvegardé en BDD - toujours visible s'il existe */}
                  {logoUrl && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">Logo sauvegardé en base de données</p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          ✓ Enregistré
                        </span>
                      </div>
                      <div className="relative w-32 h-32 border-2 border-green-500 rounded-md overflow-hidden bg-muted">
                        <Image
                          src={logoUrl}
                          alt="Logo entreprise sauvegardé"
                          fill
                          className="object-contain"
                        />
                      </div>
                      {uploadedLogoUrl === logoUrl && dropzoneProps.files.length === 0 && (
                        <p className="text-xs text-green-600 dark:text-green-400">
                          ✓ Logo uploadé et prêt à être sauvegardé. Cliquez sur &quot;Enregistrer les modifications&quot; pour finaliser.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Nouveau logo sélectionné (prévisualisation avant upload) */}
                  {dropzoneProps.files.length > 0 && dropzoneProps.files[0].preview && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">Nouveau logo sélectionné</p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          En attente d&apos;upload
                        </span>
                      </div>
                      <div className="relative w-32 h-32 border-2 border-blue-500 border-dashed rounded-md overflow-hidden bg-muted">
                        <Image
                          src={dropzoneProps.files[0].preview}
                          alt="Prévisualisation nouveau logo"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Cliquez sur &quot;Uploader les fichiers&quot; puis &quot;Enregistrer les modifications&quot; pour sauvegarder ce logo
                      </p>
                    </div>
                  )}
                </div>
              )}

              <Dropzone {...dropzoneProps}>
                <DropzoneEmptyState />
                <DropzoneContent />
              </Dropzone>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Informations légales */}
      <Card>
        <CardHeader>
          <CardTitle>Informations légales</CardTitle>
          <CardDescription>Informations complémentaires (optionnelles)</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="siret">Numéro SIRET</Label>
            <Input
              id="siret"
              value={formData.siret}
              onChange={(e) => handleChange('siret', e.target.value)}
              placeholder="123 456 789 00012"
              className="mt-1.5"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="vatNumber">Numéro de TVA</Label>
            <Input
              id="vatNumber"
              value={formData.vatNumber}
              onChange={(e) => handleChange('vatNumber', e.target.value)}
              placeholder="FR12 345678901"
              className="mt-1.5"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rcs">RCS</Label>
            <Input
              id="rcs"
              value={formData.rcs}
              onChange={(e) => handleChange('rcs', e.target.value)}
              placeholder="RCS Versailles B 814 000 000"
              className="mt-1.5"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="codeApe">Code APE</Label>
            <Input
              id="codeApe"
              value={formData.codeApe}
              onChange={(e) => handleChange('codeApe', e.target.value)}
              placeholder="4321A"
              className="mt-1.5"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="capital">Capital (€)</Label>
            <Input
              id="capital"
              type="number"
              step="0.01"
              min="0"
              value={formData.capital}
              onChange={(e) => handleChange('capital', e.target.value)}
              placeholder="20000.00"
              className="mt-1.5"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="currency">Devise</Label>
            <select
              id="currency"
              value={formData.currency}
              onChange={(e) => handleChange('currency', e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mt-1.5"
            >
              <option value="EUR">€ EUR</option>
              <option value="USD">$ USD</option>
              <option value="GBP">£ GBP</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Bouton de sauvegarde */}
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            'Enregistrer les modifications'
          )}
        </Button>
      </div>

      {/* AlertDialog pour confirmer le changement d'email */}
      <AlertDialog open={showEmailAlert} onOpenChange={setShowEmailAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Changer l&apos;adresse email</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Vous êtes sur le point de changer votre adresse email de connexion de{' '}
                <strong>{userEmail}</strong> vers <strong>{pendingEmail}</strong>.
              </p>
              <p className="font-semibold text-destructive">
                ⚠️ Attention : Cette modification changera votre adresse email de connexion dans la base de données.
              </p>
              <p>
                Un email de confirmation sera envoyé à votre nouvelle adresse. Vous devrez confirmer cette nouvelle
                adresse pour pouvoir vous connecter avec celle-ci.
              </p>
              <p>Êtes-vous sûr de vouloir continuer ?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setEmail(userEmail)
              setPendingEmail(null)
            }}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction onClick={saveSettings} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirmer le changement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  )
}
