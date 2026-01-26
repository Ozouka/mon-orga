'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Step3OptionalProps {
  data: {
    siret: string
    vatNumber: string
    currency: string
  }
  onUpdate: (data: Partial<Step3OptionalProps['data']>) => void
  onValidationChange: (isValid: boolean) => void
}

export function Step3Optional({ data, onUpdate }: Step3OptionalProps) {

  return (
    <div className="flex flex-col h-full min-w-0">
      <div className="shrink-0 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Informations complémentaires</h2>
        <p className="text-sm sm:text-base text-gray-600">Ces informations sont optionnelles</p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 sm:space-y-4">
        <div className="flex flex-col space-y-1 sm:space-y-2 min-w-0">
          <Label htmlFor="siret" className="text-sm">Numéro SIRET</Label>
          <Input
            id="siret"
            value={data.siret}
            onChange={(e) => onUpdate({ siret: e.target.value })}
            placeholder="123 456 789 00012"
            className="w-full min-w-0"
          />
        </div>

        <div className="flex flex-col space-y-1 sm:space-y-2 min-w-0">
          <Label htmlFor="vatNumber" className="text-sm">Numéro de TVA</Label>
          <Input
            id="vatNumber"
            value={data.vatNumber}
            onChange={(e) => onUpdate({ vatNumber: e.target.value })}
            placeholder="FR12 345678901"
            className="w-full min-w-0"
          />
        </div>

        <div className="flex flex-col space-y-1 sm:space-y-2 min-w-0">
          <Label htmlFor="currency" className="text-sm">Devise</Label>
          <select
            id="currency"
            value={data.currency}
            onChange={(e) => onUpdate({ currency: e.target.value })}
            className="w-full min-w-0 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="EUR">€ EUR</option>
            <option value="USD">$ USD</option>
            <option value="GBP">£ GBP</option>
          </select>
        </div>
      </div>
    </div>
  )
}