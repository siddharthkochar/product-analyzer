'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ImageUpload } from '@/components/image-upload'
import { ImagePreview } from '@/components/upload/image-preview'
import { AnalyzingState } from '@/components/upload/analyzing-state'
import { ProductResults } from '@/components/upload/product-results'
import { AnalysisError } from '@/components/upload/analysis-error'
import { compressImage } from '@/lib/utils/image-compression'
import { useToast } from '@/hooks/use-toast'
import type { Product } from '@/types/product'

type UploadState = 'idle' | 'preview' | 'analyzing' | 'success' | 'error'

interface UploadData {
  image: File | null
  preview: string | null
  result: Partial<Product> | null
  error: string | null
}

const ANALYSIS_TIMEOUT = 30000 // 30 seconds

export default function UploadPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [state, setState] = useState<UploadState>('idle')
  const [data, setData] = useState<UploadData>({
    image: null,
    preview: null,
    result: null,
    error: null,
  })
  const [isSaving, setIsSaving] = useState(false)

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (data.preview) {
        URL.revokeObjectURL(data.preview)
      }
    }
  }, [data.preview])

  // Handle image selection (STATE 1 -> STATE 2)
  const handleImageSelect = useCallback((file: File) => {
    // Create preview URL
    const previewUrl = URL.createObjectURL(file)

    setData({
      image: file,
      preview: previewUrl,
      result: null,
      error: null,
    })
    setState('preview')

    // Announce state change for screen readers
    setTimeout(() => {
      const announcement = document.createElement('div')
      announcement.setAttribute('role', 'status')
      announcement.setAttribute('aria-live', 'polite')
      announcement.textContent = 'Image selected. Ready to analyze product.'
      announcement.style.position = 'absolute'
      announcement.style.left = '-10000px'
      document.body.appendChild(announcement)
      setTimeout(() => document.body.removeChild(announcement), 1000)
    }, 100)
  }, [])

  // Handle retake/change image (STATE 2 -> STATE 1)
  const handleRetake = useCallback(() => {
    if (data.preview) {
      URL.revokeObjectURL(data.preview)
    }
    setData({
      image: null,
      preview: null,
      result: null,
      error: null,
    })
    setState('idle')
  }, [data.preview])

  // Handle analyze product (STATE 2 -> STATE 3)
  const handleAnalyze = useCallback(async () => {
    if (!data.image || !data.preview) return

    setState('analyzing')

    try {
      // Compress image to reduce upload size
      const compressed = await compressImage(data.image, 2)

      // Create FormData with compressed image file
      const formData = new FormData()
      formData.append('image', compressed.blob, compressed.filename)

      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('TIMEOUT')), ANALYSIS_TIMEOUT)
      })

      // Call analysis API with FormData (server-side route)
      const analysisPromise = fetch('/api/analyze', {
        method: 'POST',
        // Don't set Content-Type header - browser sets it automatically for FormData
        body: formData,
      }).then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`)
        }
        return res.json()
      })

      const response = await Promise.race([analysisPromise, timeoutPromise]) as {
        success: boolean
        data?: any
        error?: string
      }

      if (!response.success || !response.data) {
        throw new Error(
          response.error || 'Analysis service encountered an error. Please try again.'
        )
      }

      // Parse response data
      const productData: Partial<Product> = {
        productName: response.data.productName || response.data.product_name || '',
        brand: response.data.brand || 'Unknown',
        category: response.data.category || 'Uncategorized',
        subCategory: response.data.subCategory || response.data.sub_category || 'Other',
        expiryDate: response.data.expiryDate || response.data.expiry_date || '',
        mrp: response.data.mrp || response.data.price || '',
        weight: response.data.weight || response.data.net_weight || '',
        quantity: response.data.quantity || 1,
        ingredients: response.data.ingredients || '',
        healthScore: response.data.healthScore || response.data.health_score || 0,
        healthRating: response.data.healthRating || response.data.health_rating || '',
        concerns: response.data.concerns || '',
      }

      // Validate that we got some useful data
      if (!productData.productName && !productData.brand) {
        throw new Error(
          'No product information found. Please ensure the label is clearly visible.'
        )
      }

      setData((prev) => ({ ...prev, result: productData, error: null }))
      setState('success')

      // Announce success
      setTimeout(() => {
        const announcement = document.createElement('div')
        announcement.setAttribute('role', 'status')
        announcement.setAttribute('aria-live', 'polite')
        announcement.textContent = 'Product analysis complete. Review the extracted information.'
        announcement.style.position = 'absolute'
        announcement.style.left = '-10000px'
        document.body.appendChild(announcement)
        setTimeout(() => document.body.removeChild(announcement), 1000)
      }, 100)
    } catch (error) {
      console.error('Analysis error:', error)

      let errorMessage = 'An unexpected error occurred. Please try again.'

      if (error instanceof Error) {
        if (error.message === 'TIMEOUT') {
          errorMessage = 'Analysis is taking longer than expected. Please try again.'
        } else if (error.message.includes('fetch')) {
          errorMessage =
            'Could not connect to analysis service. Please check your internet connection.'
        } else {
          errorMessage = error.message
        }
      }

      setData((prev) => ({ ...prev, error: errorMessage, result: null }))
      setState('error')

      // Announce error
      setTimeout(() => {
        const announcement = document.createElement('div')
        announcement.setAttribute('role', 'alert')
        announcement.setAttribute('aria-live', 'assertive')
        announcement.textContent = `Error: ${errorMessage}`
        announcement.style.position = 'absolute'
        announcement.style.left = '-10000px'
        document.body.appendChild(announcement)
        setTimeout(() => document.body.removeChild(announcement), 1000)
      }, 100)
    }
  }, [data.image, data.preview])

  // Handle retry analysis (STATE 4b -> STATE 3)
  const handleRetry = useCallback(() => {
    handleAnalyze()
  }, [handleAnalyze])

  // Handle use different image (STATE 4b -> STATE 1)
  const handleUseNewImage = useCallback(() => {
    handleRetake()
  }, [handleRetake])

  // Handle save to inventory (STATE 4a -> navigate or STATE 1)
  const handleSave = useCallback(async () => {
    if (!data.result) return

    setIsSaving(true)

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data.result),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          toast({
            title: 'Product already exists',
            description: 'This product is already in your inventory.',
            variant: 'destructive',
          })
        } else {
          throw new Error(result.error || 'Failed to save product')
        }
        return
      }

      toast({
        title: 'Product saved successfully',
        description: 'Product has been added to your inventory.',
      })

      // Redirect to dashboard after short delay
      setTimeout(() => {
        router.push('/')
      }, 1500)
    } catch (error) {
      console.error('Save error:', error)
      toast({
        title: 'Failed to save product',
        description:
          error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }, [data.result, router, toast])

  // Handle try another product (STATE 4a -> STATE 1)
  const handleTryAnother = useCallback(() => {
    if (data.preview) {
      URL.revokeObjectURL(data.preview)
    }
    setData({
      image: null,
      preview: null,
      result: null,
      error: null,
    })
    setState('idle')
  }, [data.preview])

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Upload Product Image</h1>
        <p className="text-muted-foreground">
          Take a photo or upload an image to extract product information
        </p>
      </div>

      <div className="flex justify-center">
        {state === 'idle' && (
          <div className="w-full max-w-2xl">
            <ImageUpload onImageSelect={handleImageSelect} disabled={false} />
          </div>
        )}

        {state === 'preview' && data.preview && (
          <ImagePreview
            preview={data.preview}
            onAnalyze={handleAnalyze}
            onRetake={handleRetake}
            isAnalyzing={false}
          />
        )}

        {state === 'analyzing' && data.preview && (
          <AnalyzingState preview={data.preview} />
        )}

        {state === 'success' && data.result && (
          <ProductResults
            product={data.result}
            onSave={handleSave}
            onTryAnother={handleTryAnother}
            isSaving={isSaving}
          />
        )}

        {state === 'error' && data.error && (
          <AnalysisError
            error={data.error}
            onRetry={handleRetry}
            onUseNewImage={handleUseNewImage}
          />
        )}
      </div>
    </div>
  )
}
