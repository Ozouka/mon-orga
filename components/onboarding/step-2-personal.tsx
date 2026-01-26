'use client'

import { useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

interface Step2PersonalProps {
  data: {
    firstName: string
    lastName: string
    phone: string
  }
  onUpdate: (data: Partial<Step2PersonalProps['data']>) => void
  onValidationChange: (isValid: boolean) => void
}

export function Step2Personal({ data, onUpdate, onValidationChange }: Step2PersonalProps) {
  const [userEmail, setUserEmail] = useState<string>('')

  useEffect(() => {
    const fetchUserEmail = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setUserEmail(user.email)
      }
    }
    fetchUserEmail()
  }, [])

  useEffect(() => {
    const isValid = 
      data.firstName.trim() !== '' &&
      data.lastName.trim() !== '' &&
      data.phone.trim() !== ''
    
      onValidationChange(isValid)
  }, [data, onValidationChange])

  return (
    <div className="flex flex-col h-full min-w-0">
      <div className="shrink-0 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Informations personnelles</h2>
        <p className="text-sm sm:text-base text-gray-600">Renseignez vos informations personnelles</p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 min-w-0">
          <div className="flex-1 flex flex-col space-y-1 sm:space-y-2 min-w-0">
            <Label htmlFor="firstName" className="text-sm">
              Prénom <span className="text-red-500">*</span>
            </Label>
            <Input
              id="firstName"
              value={data.firstName}
              onChange={(e) => onUpdate({ firstName: e.target.value })}
              placeholder="Jean"
              required
              className="w-full min-w-0"
            />
          </div>

          <div className="flex-1 flex flex-col space-y-1 sm:space-y-2 min-w-0">
            <Label htmlFor="lastName" className="text-sm">
              Nom <span className="text-red-500">*</span>
            </Label>
            <Input
              id="lastName"
              value={data.lastName}
              onChange={(e) => onUpdate({ lastName: e.target.value })}
              placeholder="Dupont"
              required
              className="w-full min-w-0"
            />
          </div>
        </div>

        <div className="flex flex-col space-y-1 sm:space-y-2 min-w-0">
          <Label htmlFor="email" className="text-sm">Email</Label>
          <Input
            id="email"
            type="email"
            value={userEmail}
            className="w-full min-w-0"
          />
        </div>

        <div className="flex flex-col space-y-1 sm:space-y-2 min-w-0">
          <Label htmlFor="phone" className="text-sm">
            Téléphone <span className="text-red-500">*</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            value={data.phone}
            onChange={(e) => onUpdate({ phone: e.target.value })}
            placeholder="06 12 34 56 78"
            required
            className="w-full min-w-0"
          />
        </div>
      </div>
    </div>
  )
}