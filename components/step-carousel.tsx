'use client'

import useEmblaCarousel from 'embla-carousel-react'
import { useState, useEffect, useCallback, ReactNode } from 'react'

interface StepCarouselProps {
  children: ReactNode[]
  onStepChange?: (index: number) => void
  allowDrag?: boolean
}

export function StepCarousel({ onStepChange, allowDrag = false }: StepCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false,
    skipSnaps: false,
    dragFree: false,
    watchDrag: allowDrag,
  })
  
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(true)

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  const onSelect = useCallback((emblaApi: any) => {
    const index = emblaApi.selectedScrollSnap()
    setSelectedIndex(index)
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
    onStepChange?.(index)
  }, [onStepChange])

  useEffect(() => {
    if (!emblaApi) return
    onSelect(emblaApi)
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    
    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi, onSelect])

  return {
    emblaRef,
    selectedIndex,
    canScrollPrev,
    canScrollNext,
    scrollPrev,
    scrollNext,
  }
}