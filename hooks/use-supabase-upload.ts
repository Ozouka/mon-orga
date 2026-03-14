'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useDropzone, type FileRejection } from 'react-dropzone'

export interface UploadFile {
  name: string
  size: number
  type: string
  preview?: string
  errors: Array<{ message: string }>
  file?: File
}

export interface UseSupabaseUploadReturn {
  files: UploadFile[]
  setFiles: React.Dispatch<React.SetStateAction<UploadFile[]>>
  errors: Array<{ name: string; message: string }>
  successes: string[]
  loading: boolean
  isSuccess: boolean
  isDragActive: boolean
  isDragReject: boolean
  maxFileSize: number
  maxFiles: number
  inputRef: React.RefObject<HTMLInputElement>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getRootProps: () => any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getInputProps: () => any
  onUpload: () => Promise<void>
}

interface UseSupabaseUploadOptions {
  bucketName: string | null
  path: string | null
  allowedMimeTypes?: string[]
  maxFiles?: number
  maxFileSize?: number
  onUploadComplete?: (urls: string[]) => void
}

// Sanitize file names to avoid invalid keys in Supabase Storage
function sanitizeFileName(originalName: string): string {
  const trimmed = originalName.trim()

  if (!trimmed) {
    return 'fichier'
  }

  const lastDotIndex = trimmed.lastIndexOf('.')
  const baseName = lastDotIndex > 0 ? trimmed.slice(0, lastDotIndex) : trimmed
  const extension = lastDotIndex > 0 ? trimmed.slice(lastDotIndex + 1) : ''

  const normalizedBase = baseName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()

  const safeBase = normalizedBase || 'fichier'
  const safeExt = extension
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '')
    .toLowerCase()

  return safeExt ? `${safeBase}.${safeExt}` : safeBase
}

export function useSupabaseUpload({
  bucketName,
  path,
  allowedMimeTypes = [],
  maxFiles = 1,
  maxFileSize = 1000 * 1000 * 10, // 10MB default
  onUploadComplete,
}: UseSupabaseUploadOptions): UseSupabaseUploadReturn {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [errors, setErrors] = useState<Array<{ name: string; message: string }>>([])
  const [successes, setSuccesses] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      setErrors([])
      setSuccesses([])

      // Handle rejected files
      rejectedFiles.forEach(({ file, errors: fileErrors }) => {
        setErrors((prev) => [
          ...prev,
          ...fileErrors.map((err) => ({
            name: file.name,
            message: err.message,
          })),
        ])
      })

      // Handle accepted files
      const newFiles: UploadFile[] = acceptedFiles.map((file) => {
        const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
        return {
          name: file.name,
          size: file.size,
          type: file.type,
          preview,
          errors: [],
          file,
        }
      })

      // Check max files limit
      const totalFiles = files.length + newFiles.length
      if (totalFiles > maxFiles) {
        setErrors((prev) => [
          ...prev,
          {
            name: 'limit',
            message: `Vous ne pouvez uploader que ${maxFiles} fichier${maxFiles > 1 ? 's' : ''} maximum`,
          },
        ])
        return
      }

      setFiles((prev) => [...prev, ...newFiles])
    },
    [files.length, maxFiles]
  )

  const onDropRejected = useCallback((rejectedFiles: FileRejection[]) => {
    rejectedFiles.forEach(({ file, errors: fileErrors }) => {
      setErrors((prev) => [
        ...prev,
        ...fileErrors.map((err) => ({
          name: file.name,
          message: err.message,
        })),
      ])
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive, isDragReject, inputRef } = useDropzone({
    onDrop,
    onDropRejected,
    accept: allowedMimeTypes.length > 0 ? Object.fromEntries(allowedMimeTypes.map((type) => [type, []])) : undefined,
    maxSize: maxFileSize,
    maxFiles,
    multiple: maxFiles > 1,
  })

  const onUpload = useCallback(async () => {
    if (!bucketName || files.length === 0) {
      return
    }

    setLoading(true)
    setErrors([])
    setSuccesses([])

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Utilisateur non connecté')
      }

      const uploadPromises = files.map(async (fileObj) => {
        if (!fileObj.file) {
          throw new Error(`Fichier ${fileObj.name} introuvable`)
        }

        const safeName = sanitizeFileName(fileObj.file.name)
        const fileName = `${user.id}/${Date.now()}-${safeName}`
        const filePath = path ? `${path}/${fileName}` : fileName

        const { error: uploadError } = await supabase.storage.from(bucketName).upload(filePath, fileObj.file, {
          cacheControl: '3600',
          upsert: false,
        })

        if (uploadError) {
          throw uploadError
        }

        // Obtenir l'URL publique du fichier
        const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath)
        return data.publicUrl
      })

      const urls = await Promise.all(uploadPromises)
      setSuccesses(files.map((f) => f.name))
      
      // Appeler le callback avec les URLs
      onUploadComplete?.(urls)

      // Clean up preview URLs
      files.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview)
        }
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue lors de l\'upload'
      setErrors([
        {
          name: 'upload',
          message: errorMessage,
        },
      ])
    } finally {
      setLoading(false)
    }
  }, [files, bucketName, path, onUploadComplete])

  const isSuccess = successes.length === files.length && files.length > 0 && !loading

  return {
    files,
    setFiles,
    errors,
    successes,
    loading,
    isSuccess,
    isDragActive,
    isDragReject,
    maxFileSize,
    maxFiles,
    inputRef,
    getRootProps,
    getInputProps,
    onUpload,
  }
}
