'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, RotateCcw } from 'lucide-react'
import type { ImageItem } from '@/components/upload/image-gallery'

interface AnalyzingStateProps {
  imageCount?: number
  images?: ImageItem[]
  onCancel?: () => void
  preview?: string // Keep for backward compatibility
}

export function AnalyzingState({
  preview,
  imageCount = 1,
  images,
  onCancel,
}: AnalyzingStateProps) {
  const estimatedTime = imageCount * 3 // 3 seconds per image estimate
  const displayMessage =
    imageCount > 1 ? `Analyzing ${imageCount} images...` : 'Analyzing Product...'

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card className="overflow-hidden relative">
        <div className="relative w-full aspect-video bg-muted">
          {/* Show thumbnail grid if multiple images */}
          {images && images.length > 1 ? (
            <div className="grid grid-cols-3 gap-2 p-4 h-full">
              {images.slice(0, 6).map((img, index) => (
                <div
                  key={img.id}
                  className="relative aspect-square rounded-md overflow-hidden opacity-50"
                >
                  <img
                    src={img.previewUrl}
                    alt={`Product image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <img
              src={preview || images?.[0]?.previewUrl || ''}
              alt="Product being analyzed"
              className="w-full h-full object-contain opacity-50"
            />
          )}

          <div className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-sm">
            <div className="text-center space-y-4">
              <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
              <div>
                <p className="text-lg font-semibold" role="status" aria-live="polite">
                  {displayMessage}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Extracting product information
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          This may take up to {estimatedTime} seconds. Please wait...
        </p>
        {onCancel && (
          <Button
            onClick={onCancel}
            variant="outline"
            size="sm"
            className="text-sm"
            aria-label="Cancel analysis and change images"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Change Images
          </Button>
        )}
      </div>
    </div>
  )
}
