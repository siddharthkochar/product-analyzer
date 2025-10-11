'use client'

import { useCallback, useRef, useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Camera, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { validateImageFile } from '@/lib/utils/image-compression'

interface ImageUploadProps {
  onImageSelect: (file: File) => void
  disabled?: boolean
}

export function ImageUpload({ onImageSelect, disabled }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [hasCamera, setHasCamera] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

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

  const handleFileValidation = useCallback((file: File) => {
    const validation = validateImageFile(file)
    if (!validation.valid) {
      setValidationError(validation.error || 'Invalid file')
      return false
    }
    setValidationError(null)
    return true
  }, [])

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0]
        if (handleFileValidation(file)) {
          onImageSelect(file)
        }
      }
      setIsDragging(false)
    },
    [onImageSelect, handleFileValidation]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    maxFiles: 1,
    disabled,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    noClick: hasCamera, // Disable click when camera is available
  })

  const handleCameraCapture = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file && handleFileValidation(file)) {
        onImageSelect(file)
      }
      // Reset input value to allow selecting the same file again
      if (event.target) {
        event.target.value = ''
      }
    },
    [onImageSelect, handleFileValidation]
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
                <p className="text-lg font-semibold">Upload Product Image</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {hasCamera
                    ? 'Take a photo or upload from your device'
                    : 'Drag and drop an image here, or click to select'}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Supports: PNG, JPG, JPEG, WEBP (max 5MB)
                </p>
              </div>

              {hasCamera ? (
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
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
                    variant="secondary"
                    disabled={disabled}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleBrowseClick()
                    }}
                    className="h-14 sm:h-12 w-full sm:flex-1 text-base sm:text-sm"
                    aria-label="Browse files"
                  >
                    <Upload className="mr-2 h-6 w-6 sm:h-5 sm:w-5" />
                    Browse Files
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
