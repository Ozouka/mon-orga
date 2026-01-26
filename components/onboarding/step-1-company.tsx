
'use client'

import { useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Step1CompanyProps {
  data: {
    companyName: string
    activityType: string
    address: string
    postalCode: string
    city: string
    country: string
  }
  onUpdate: (data: Partial<Step1CompanyProps['data']>) => void
  onValidationChange: (isValid: boolean) => void
}

export function Step1Company({ data, onUpdate, onValidationChange }: Step1CompanyProps) {
  useEffect(() => {
    const isValid = 
      data.companyName.trim() !== '' &&
      data.activityType !== '' &&
      data.address.trim() !== '' &&
      data.postalCode.trim() !== '' &&
      data.city.trim() !== '' &&
      data.country.trim() !== ''
      
    onValidationChange(isValid)
  }, [data, onValidationChange])

  return (
    <div className="flex flex-col h-full min-w-0">
      <div className="shrink-0 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Informations de l'entreprise</h2>
        <p className="text-sm sm:text-base text-gray-600">Renseignez les informations de votre entreprise</p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 sm:space-y-4">
        <div className="flex flex-col space-y-1 sm:space-y-2 min-w-0">
          <Label htmlFor="companyName" className="text-sm">
            Nom de l'entreprise <span className="text-red-500">*</span>
          </Label>
          <Input
            id="companyName"
            value={data.companyName}
            onChange={(e) => onUpdate({ companyName: e.target.value })}
            placeholder="Ex: Plomberie Martin"
            required
            className="w-full min-w-0"
          />
        </div>

        <div className="flex flex-col space-y-1 sm:space-y-2 min-w-0">
          <Label htmlFor="activityType" className="text-sm">
            Type d'activité <span className="text-red-500">*</span>
          </Label>
          <select
            id="activityType"
            value={data.activityType}
            onChange={(e) => onUpdate({ activityType: e.target.value })}
            className="w-full min-w-0 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

        <div className="flex flex-col space-y-1 sm:space-y-2 min-w-0">
          <Label htmlFor="address" className="text-sm">
            Adresse <span className="text-red-500">*</span>
          </Label>
          <Input
            id="address"
            value={data.address}
            onChange={(e) => onUpdate({ address: e.target.value })}
            placeholder="Ex: 123 Rue de la République"
            required
            className="w-full min-w-0"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 min-w-0">
          <div className="flex-1 flex flex-col space-y-1 sm:space-y-2 min-w-0">
            <Label htmlFor="postalCode" className="text-sm">
              Code postal <span className="text-red-500">*</span>
            </Label>
            <Input
              id="postalCode"
              value={data.postalCode}
              onChange={(e) => onUpdate({ postalCode: e.target.value })}
              placeholder="75001"
              required
              className="w-full min-w-0"
            />
          </div>

          <div className="flex-1 flex flex-col space-y-1 sm:space-y-2 min-w-0">
            <Label htmlFor="city" className="text-sm">
              Ville <span className="text-red-500">*</span>
            </Label>
            <Input
              id="city"
              value={data.city}
              onChange={(e) => onUpdate({ city: e.target.value })}
              placeholder="Paris"
              required
              className="w-full min-w-0"
            />
          </div>
        </div>

        <div className="flex flex-col space-y-1 sm:space-y-2 min-w-0">
          <Label htmlFor="country" className="text-sm">
            Pays <span className="text-red-500">*</span>
          </Label>
          <Input
            id="country"
            value={data.country}
            onChange={(e) => onUpdate({ country: e.target.value })}
            placeholder="France"
            required
            className="w-full min-w-0"
          />
        </div>
      </div>
    </div>
  )
}