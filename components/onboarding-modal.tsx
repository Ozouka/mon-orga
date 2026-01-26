'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Step1Company } from './onboarding/step-1-company'
import { Step2Personal } from './onboarding/step-2-personal'
import { Step3Optional } from './onboarding/step-3-optional'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import useEmblaCarousel from 'embla-carousel-react'

const TOTAL_STEPS = 3

export function OnboardingModal() {
  const router = useRouter()
  
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false,
    skipSnaps: false,
    dragFree: false,
    watchDrag: false,
  })
  
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    // Step 1: Informations entreprise
    companyName: '',
    activityType: '',
    address: '',
    postalCode: '',
    city: '',
    country: 'France',
    // Step 2: Informations personnelles
    firstName: '',
    lastName: '',
    phone: '',
    // Step 3: Informations optionnelles
    siret: '',
    vatNumber: '',
    currency: 'EUR',
  })

  const [stepValidations, setStepValidations] = useState({
    step1: false,
    step2: false,
    step3: true,
  })

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (selectedIndex === 0 && !stepValidations.step1) return
    if (selectedIndex === 1 && !stepValidations.step2) return
    
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi, selectedIndex, stepValidations])

  const onSelect = useCallback((emblaApi: any) => {
    setSelectedIndex(emblaApi.selectedScrollSnap())
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [])

  useEffect(() => {
    if (!emblaApi) return
    onSelect(emblaApi)
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    
    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi, onSelect])

  const updateFormData = useCallback((data: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...data }))
  }, [])

  const updateStepValidation = useCallback((step: number, isValid: boolean) => {
    setStepValidations(prev => ({ ...prev, [`step${step}`]: isValid }))
  }, [])

  const handleStep1Validation = useCallback((isValid: boolean) => {
    updateStepValidation(1, isValid)
  }, [updateStepValidation])

  const handleStep2Validation = useCallback((isValid: boolean) => {
    updateStepValidation(2, isValid)
  }, [updateStepValidation])

  const handleStep3Validation = useCallback((isValid: boolean) => {
    updateStepValidation(3, isValid)
  }, [updateStepValidation])

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Utilisateur non connecté')
      }

      const { error } = await supabase
        .from('user_data')
        .upsert({
          user_id: user.id,
          company_name: formData.companyName,
          activity_type: formData.activityType,
          address: formData.address,
          postal_code: formData.postalCode,
          city: formData.city,
          country: formData.country,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          siret: formData.siret || null,
          vat_number: formData.vatNumber || null,
          currency: formData.currency,
          onboarding_completed: true,
        })

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
      alert('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 sm:p-6">
      <div className="bg-white rounded-lg w-full flex flex-col shadow-xl sm:mx-0 max-h-[90vh] min-w-0">
        <div className="shrink-0 p-4 sm:p-6 border-b">
          <div className="flex items-center justify-between mb-2 gap-2">
            <span className="text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">
              Étape {selectedIndex + 1} sur {TOTAL_STEPS}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 min-w-0">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((selectedIndex + 1) / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden" ref={emblaRef}>
          <div className="flex h-full">
            <div className="min-w-full shrink-0 flex flex-col min-h-0">
              <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
                <Step1Company
                  data={formData}
                  onUpdate={updateFormData}
                  onValidationChange={handleStep1Validation}
                />
              </div>
            </div>
            <div className="min-w-full shrink-0 flex flex-col min-h-0">
              <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
                <Step2Personal
                  data={formData}
                  onUpdate={updateFormData}
                  onValidationChange={handleStep2Validation}
                />
              </div>
            </div>
            <div className="min-w-full shrink-0 flex flex-col min-h-0">
              <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
                <Step3Optional
                  data={formData}
                  onUpdate={updateFormData}
                  onValidationChange={handleStep3Validation}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation - flexbox */}
        <div className="shrink-0 flex justify-between items-center gap-2 p-4 sm:p-6 border-t">
          <Button
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            variant="outline"
            className="shrink-0"
          >
            Précédent
          </Button>
          {selectedIndex === TOTAL_STEPS - 1 ? (
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="bg-blue-500 hover:bg-blue-600 shrink-0"
            >
              {isSubmitting ? 'Enregistrement...' : 'Terminer'}
            </Button>
          ) : (
            <Button
              onClick={scrollNext}
              disabled={!canScrollNext || !stepValidations[`step${selectedIndex + 1}` as keyof typeof stepValidations]}
              className="bg-blue-500 hover:bg-blue-600 shrink-0"
            >
              Suivant
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}