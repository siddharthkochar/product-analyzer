'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Plus } from 'lucide-react'

export interface ImageItem {
  file: File
  previewUrl: string
  id: string
}

interface ImageGalleryProps {
  images: ImageItem[]
  onRemove: (index: number) => void
  onAddMore: () => void
  maxImages?: number
}

export function ImageGallery({
  images,
  onRemove,
  onAddMore,
  maxImages = 5,
}: ImageGalleryProps) {
  const canAddMore = images.length < maxImages

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Image count badge */}
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-sm">
          {images.length} of {maxImages} images
        </Badge>
        <p className="text-sm text-muted-foreground">
          {canAddMore
            ? `Add ${maxImages - images.length} more image${maxImages - images.length !== 1 ? 's' : ''}`
            : 'Maximum images reached'}
        </p>
      </div>

      {/* Responsive grid */}
      <div
        className="grid grid-cols-2 md:grid-cols-3 gap-4"
        role="list"
        aria-label="Selected product images"
      >
        {images.map((image, index) => (
          <Card
            key={image.id}
            className="relative overflow-hidden aspect-square group"
            role="listitem"
          >
            <img
              src={image.previewUrl}
              alt={`Product image ${index + 1}`}
              className="w-full h-full object-cover"
            />

            {/* Remove button overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => onRemove(index)}
                className="h-12 w-12"
                aria-label={`Remove image ${index + 1}`}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Image number badge */}
            <Badge
              variant="default"
              className="absolute top-2 left-2 text-xs pointer-events-none"
            >
              {index + 1}
            </Badge>
          </Card>
        ))}

        {/* Add more images card */}
        {canAddMore && (
          <Card
            className="aspect-square flex items-center justify-center border-2 border-dashed border-muted-foreground/25 bg-muted/50 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
            onClick={onAddMore}
            role="button"
            tabIndex={0}
            aria-label="Add more images"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onAddMore()
              }
            }}
          >
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <div className="rounded-full bg-primary/10 p-4">
                  <Plus className="h-8 w-8 text-primary" aria-hidden="true" />
                </div>
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                Add More
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
