'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface ImageUploadProps {
  onImageSelect: (base64: string, file: File) => void
  preview?: string | null
  onClear?: () => void
  disabled?: boolean
}

export function ImageUpload({ onImageSelect, preview, onClear, disabled }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0]
        const reader = new FileReader()

        reader.onload = () => {
          const base64 = reader.result as string
          onImageSelect(base64, file)
        }

        reader.readAsDataURL(file)
      }
      setIsDragging(false)
    },
    [onImageSelect]
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
  })

  if (preview) {
    return (
      <Card className="relative w-full max-w-2xl mx-auto">
        <div className="relative aspect-video w-full overflow-hidden rounded-lg">
          <img
            src={preview}
            alt="Product preview"
            className="w-full h-full object-contain bg-muted"
          />
        </div>
        {onClear && !disabled && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={onClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </Card>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
        ${isDragActive || isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5'}
      `}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-4">
        {isDragActive || isDragging ? (
          <>
            <ImageIcon className="h-16 w-16 text-primary" />
            <div>
              <p className="text-lg font-semibold text-primary">Drop your image here</p>
              <p className="text-sm text-muted-foreground mt-1">Release to upload</p>
            </div>
          </>
        ) : (
          <>
            <Upload className="h-16 w-16 text-muted-foreground" />
            <div>
              <p className="text-lg font-semibold">Upload Product Image</p>
              <p className="text-sm text-muted-foreground mt-1">
                Drag and drop an image here, or click to select
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Supports: PNG, JPG, JPEG, WEBP
              </p>
            </div>
            <Button type="button" variant="secondary" disabled={disabled}>
              Select Image
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
