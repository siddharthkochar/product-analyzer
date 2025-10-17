'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ImageUpload } from '@/components/image-upload'
import { ImageGallery, type ImageItem } from '@/components/upload/image-gallery'
import { AnalyzingState } from '@/components/upload/analyzing-state'
import { ProductResults } from '@/components/upload/product-results'
import { AnalysisError } from '@/components/upload/analysis-error'
import { compressImage } from '@/lib/utils/image-compression'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Camera, Upload } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Product } from '@/types/product'

type UploadState = 'idle' | 'gallery' | 'analyzing' | 'success' | 'error'

interface AnalysisMetadata {
  imagesProcessed: number
  totalImages: number
  failedImages: number
  confidence: number
  processingTimeMs: number
}

interface UploadData {
  images: ImageItem[]
  result: (Partial<Product> & { nutrition?: any }) | null
  metadata: AnalysisMetadata | null
  error: string | null
}

const ANALYSIS_TIMEOUT = 60000 // 60 seconds (1 minute)

export default function UploadPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [state, setState] = useState<UploadState>('idle')
  const [data, setData] = useState<UploadData>({
    images: [],
    result: null,
    metadata: null,
    error: null,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [showAddMoreOptions, setShowAddMoreOptions] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      data.images.forEach((img) => URL.revokeObjectURL(img.previewUrl))
    }
  }, [data.images])

  // Handle images selection
  const handleImagesSelect = useCallback((files: File[]) => {
    const newImages: ImageItem[] = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      id: `${Date.now()}-${Math.random()}`,
    }))

    setData((prev) => ({
      ...prev,
      images: [...prev.images, ...newImages],
      result: null,
      metadata: null,
      error: null,
    }))
    setState('gallery')

    // Announce state change for screen readers
    setTimeout(() => {
      const announcement = document.createElement('div')
      announcement.setAttribute('role', 'status')
      announcement.setAttribute('aria-live', 'polite')
      announcement.textContent = `${files.length} image${files.length !== 1 ? 's' : ''} selected. ${
        files.length + data.images.length
      } total images ready for analysis.`
      announcement.style.position = 'absolute'
      announcement.style.left = '-10000px'
      document.body.appendChild(announcement)
      setTimeout(() => document.body.removeChild(announcement), 1000)
    }, 100)
  }, [data.images.length])

  // Handle remove image
  const handleRemoveImage = useCallback((index: number) => {
    setData((prev) => {
      const imageToRemove = prev.images[index]
      URL.revokeObjectURL(imageToRemove.previewUrl)

      const newImages = prev.images.filter((_, i) => i !== index)

      // If no images left, go back to idle state
      if (newImages.length === 0) {
        setState('idle')
      }

      return {
        ...prev,
        images: newImages,
      }
    })
  }, [])

  // Handle add more images
  const handleAddMore = useCallback(() => {
    // Show options dialog
    setShowAddMoreOptions(true)
  }, [])

  // Handle camera capture for adding more
  const handleCameraCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleImagesSelect(Array.from(files))
    }
    e.target.value = ''
    setShowAddMoreOptions(false)
  }, [handleImagesSelect])

  // Handle file upload for adding more
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleImagesSelect(Array.from(files))
    }
    e.target.value = ''
    setShowAddMoreOptions(false)
  }, [handleImagesSelect])

  // Handle analyze products (multiple images)
  const handleAnalyze = useCallback(async () => {
    if (data.images.length === 0) return

    setState('analyzing')

    try {
      // Compress all images
      const compressedImages = await Promise.all(
        data.images.map((img) => compressImage(img.file, 2))
      )

      // Create FormData with all compressed images
      const formData = new FormData()
      compressedImages.forEach((compressed, index) => {
        formData.append(`image${index}`, compressed.blob, `product-${index}.jpg`)
      })

      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('TIMEOUT')), ANALYSIS_TIMEOUT)
      })

      // Call multi-image analysis API
      const analysisPromise = fetch('/api/analyze-multiple', {
        method: 'POST',
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
        metadata?: AnalysisMetadata
        error?: string
        code?: string
      }

      if (!response.success || !response.data) {
        throw new Error(
          response.error || 'Analysis service encountered an error. Please try again.'
        )
      }

      // Handle array response from n8n (extract first item)
      const rawData = Array.isArray(response.data) ? response.data[0] : response.data

      // Parse response data
      const nutritionData = rawData.nutrition || null

      const productData: Partial<Product> & { nutrition?: any } = {
        productName: rawData.productName || rawData.product_name || '',
        brand: rawData.brand || 'Unknown',
        category: rawData.category || 'Uncategorized',
        subCategory: rawData.subCategory || rawData.sub_category || 'Other',
        expiryDate: rawData.expiryDate || rawData.expiry_date || '',
        mrp: rawData.mrp || rawData.price || '',
        weight: rawData.weight || rawData.net_weight || '',
        quantity: rawData.quantity || 1,
        ingredients: rawData.ingredients || '',
        nutritionalInfo: nutritionData ? JSON.stringify(nutritionData) : '',
        healthScore: rawData.healthScore || rawData.health_score || 0,
        healthRating: rawData.healthRating || rawData.health_rating || '',
        concerns: Array.isArray(rawData.concerns)
          ? rawData.concerns.join('\n')
          : (rawData.concerns || ''),
        nutrition: nutritionData,
      }

      // Validate that we got some useful data
      if (!productData.productName && !productData.brand) {
        throw new Error(
          'No product information found. Please ensure the labels are clearly visible.'
        )
      }

      setData((prev) => ({
        ...prev,
        result: productData,
        metadata: response.metadata || null,
        error: null,
      }))
      setState('success')

      // Announce success
      setTimeout(() => {
        const announcement = document.createElement('div')
        announcement.setAttribute('role', 'status')
        announcement.setAttribute('aria-live', 'polite')
        announcement.textContent = `Product analysis complete from ${data.images.length} image${
          data.images.length !== 1 ? 's' : ''
        }. Review the extracted information.`
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
          errorMessage = `Analysis timed out after 60 seconds. Try with fewer images or better quality photos.`
        } else if (error.message.includes('fetch')) {
          errorMessage =
            'Could not connect to analysis service. Please check your internet connection.'
        } else {
          errorMessage = error.message
        }
      }

      setData((prev) => ({ ...prev, error: errorMessage, result: null, metadata: null }))
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
  }, [data.images])

  // Handle retry analysis
  const handleRetry = useCallback(() => {
    handleAnalyze()
  }, [handleAnalyze])

  // Handle use different image - clear all images
  const handleUseNewImage = useCallback(() => {
    data.images.forEach((img) => URL.revokeObjectURL(img.previewUrl))
    setData({
      images: [],
      result: null,
      metadata: null,
      error: null,
    })
    setState('idle')
  }, [data.images])

  // Handle save to inventory (STATE 4a -> navigate or STATE 1)
  const handleSave = useCallback(async (editedProduct: Partial<Product> & { nutrition?: any }) => {
    setIsSaving(true)

    try {
      // Ensure nutrition data is included in the save request for n8n workflow
      console.log('[SAVE] Sending product data with nutrition:', editedProduct)

      const response = await fetch('/api/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedProduct),
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
  }, [router, toast])

  // Handle try another product
  const handleTryAnother = useCallback(() => {
    data.images.forEach((img) => URL.revokeObjectURL(img.previewUrl))
    setData({
      images: [],
      result: null,
      metadata: null,
      error: null,
    })
    setState('idle')
  }, [data.images])

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Upload Product Images</h1>
        <p className="text-muted-foreground">
          Take photos or upload images to extract product information
        </p>
      </div>

      {/* Hidden inputs for "Add More" functionality */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple={data.images.length < 5}
        onChange={handleCameraCapture}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Add More Options Dialog */}
      <Dialog open={showAddMoreOptions} onOpenChange={setShowAddMoreOptions}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add More Images</DialogTitle>
            <DialogDescription>
              Choose how you want to add more product images
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <Button
              size="lg"
              onClick={() => {
                cameraInputRef.current?.click()
              }}
              className="h-14 text-base"
            >
              <Camera className="mr-2 h-5 w-5" />
              Take Photo
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                fileInputRef.current?.click()
              }}
              className="h-14 text-base"
            >
              <Upload className="mr-2 h-5 w-5" />
              Upload from Device
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex justify-center">
        {state === 'idle' && (
          <div className="w-full max-w-2xl">
            <ImageUpload
              onImagesSelect={handleImagesSelect}
              disabled={false}
              currentImageCount={data.images.length}
              maxImages={5}
            />
          </div>
        )}

        {state === 'gallery' && data.images.length > 0 && (
          <div className="w-full space-y-6">
            <ImageGallery
              images={data.images}
              onRemove={handleRemoveImage}
              onAddMore={handleAddMore}
              maxImages={5}
            />

            <div className="flex justify-center">
              <Button
                onClick={handleAnalyze}
                size="lg"
                className="h-14 px-8 text-base"
                aria-label={`Analyze ${data.images.length} image${
                  data.images.length !== 1 ? 's' : ''
                }`}
              >
                Analyze All ({data.images.length} image{data.images.length !== 1 ? 's' : ''})
              </Button>
            </div>
          </div>
        )}

        {state === 'analyzing' && data.images.length > 0 && (
          <AnalyzingState
            imageCount={data.images.length}
            images={data.images}
            onCancel={handleUseNewImage}
          />
        )}

        {state === 'success' && data.result && (
          <ProductResults
            product={data.result}
            metadata={data.metadata}
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
