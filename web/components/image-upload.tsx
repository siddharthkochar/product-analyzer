'use client'

import { useCallback, useRef, useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Camera, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { validateImageFile } from '@/lib/utils/image-compression'

interface ImageUploadProps {
  onImagesSelect: (files: File[]) => void
  disabled?: boolean
  currentImageCount?: number
  maxImages?: number
}

export function ImageUpload({
  onImagesSelect,
  disabled,
  currentImageCount = 0,
  maxImages = 5,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [hasCamera, setHasCamera] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const remainingSlots = maxImages - currentImageCount

  // Detect if device has camera capability
  useEffect(() => {
    const checkCamera = async () => {
      try {
        // Check if running on mobile or has camera support
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        )

        // Check for mediaDevices API
        const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)

        setHasCamera(isMobile || hasMediaDevices)
      } catch (error) {
        setHasCamera(false)
      }
    }

    checkCamera()
  }, [])

  const handleFilesValidation = useCallback(
    (files: File[]) => {
      // Check if adding these files would exceed max limit
      if (currentImageCount + files.length > maxImages) {
        setValidationError(
          `Maximum ${maxImages} images allowed. You can add ${remainingSlots} more image${remainingSlots !== 1 ? 's' : ''}.`
        )
        return []
      }

      // Validate each file
      const validFiles: File[] = []
      for (const file of files) {
        const validation = validateImageFile(file)
        if (!validation.valid) {
          setValidationError(validation.error || 'Invalid file')
          return []
        }
        validFiles.push(file)
      }

      setValidationError(null)
      return validFiles
    },
    [currentImageCount, maxImages, remainingSlots]
  )

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const validFiles = handleFilesValidation(acceptedFiles)
        if (validFiles.length > 0) {
          onImagesSelect(validFiles)
        }
      }
      setIsDragging(false)
    },
    [onImagesSelect, handleFilesValidation]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    maxFiles: remainingSlots,
    multiple: true,
    disabled,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    noClick: hasCamera, // Disable click when camera is available
  })

  const handleCameraCapture = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files
      if (files && files.length > 0) {
        const filesArray = Array.from(files)
        const validFiles = handleFilesValidation(filesArray)
        if (validFiles.length > 0) {
          onImagesSelect(validFiles)
        }
      }
      // Reset input value to allow selecting the same file again
      if (event.target) {
        event.target.value = ''
      }
    },
    [onImagesSelect, handleFilesValidation]
  )

  const handleBrowseClick = useCallback(() => {
    // Trigger the dropzone file input
    const dropzoneInput = document.querySelector('input[type="file"]') as HTMLInputElement
    if (dropzoneInput && dropzoneInput !== cameraInputRef.current) {
      dropzoneInput.click()
    }
  }, [])

  return (
    <div className="w-full space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 sm:p-12 text-center transition-colors
          ${isDragActive || isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : hasCamera ? '' : 'cursor-pointer hover:border-primary hover:bg-primary/5'}
        `}
      >
        <input {...getInputProps()} aria-label="File upload input" />
        <div className="flex flex-col items-center gap-4">
          {isDragActive || isDragging ? (
            <>
              <ImageIcon className="h-16 w-16 text-primary" aria-hidden="true" />
              <div>
                <p className="text-lg font-semibold text-primary">Drop your image here</p>
                <p className="text-sm text-muted-foreground mt-1">Release to upload</p>
              </div>
            </>
          ) : (
            <>
              <Upload className="h-16 w-16 text-muted-foreground" aria-hidden="true" />
              <div>
                <p className="text-lg font-semibold">Upload Product Images</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {hasCamera
                    ? 'Take photos or upload from your device'
                    : 'Drag and drop images here, or click to select'}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Upload up to {maxImages} images • PNG, JPG, JPEG, WEBP (max 5MB each)
                </p>
              </div>

              {hasCamera ? (
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple={remainingSlots > 1}
                    onChange={handleCameraCapture}
                    className="hidden"
                    disabled={disabled}
                    aria-label="Camera capture input"
                  />
                  <Button
                    type="button"
                    variant="default"
                    disabled={disabled}
                    onClick={(e) => {
                      e.stopPropagation()
                      cameraInputRef.current?.click()
                    }}
                    className="h-14 sm:h-12 w-full sm:flex-1 text-base sm:text-sm"
                    aria-label="Take photo with camera"
                  >
                    <Camera className="mr-2 h-6 w-6 sm:h-5 sm:w-5" />
                    Take Photo
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    disabled={disabled}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleBrowseClick()
                    }}
                    className="h-14 sm:h-12 w-full sm:flex-1 text-base sm:text-sm"
                    aria-label="Upload photo"
                  >
                    <Upload className="mr-2 h-6 w-6 sm:h-5 sm:w-5" />
                    Upload Photo
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="secondary" disabled={disabled} className="h-14 sm:h-12 text-base sm:text-sm">
                  Select Image
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {validationError && (
        <div
          className="text-sm text-destructive text-center p-3 bg-destructive/10 rounded-md"
          role="alert"
          aria-live="assertive"
        >
          {validationError}
        </div>
      )}
    </div>
  )
}
