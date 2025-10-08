'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Camera, RotateCcw } from 'lucide-react'
import Image from 'next/image'

interface ImagePreviewProps {
  preview: string
  onAnalyze: () => void
  onRetake: () => void
  isAnalyzing: boolean
}

export function ImagePreview({
  preview,
  onAnalyze,
  onRetake,
  isAnalyzing,
}: ImagePreviewProps) {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card className="overflow-hidden">
        <div className="relative w-full aspect-video bg-muted">
          <img
            src={preview}
            alt="Product preview"
            className="w-full h-full object-contain"
          />
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          onClick={onRetake}
          variant="outline"
          size="lg"
          disabled={isAnalyzing}
          className="flex-1 sm:flex-initial"
          aria-label="Retake or change photo"
        >
          <RotateCcw className="mr-2 h-5 w-5" />
          Retake Photo
        </Button>

        <Button
          onClick={onAnalyze}
          size="lg"
          disabled={isAnalyzing}
          className="flex-1 sm:flex-initial min-w-[200px]"
          aria-label="Analyze product image"
        >
          <Camera className="mr-2 h-5 w-5" />
          Analyze Product
        </Button>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Review your image and click Analyze Product to extract product information
      </p>
    </div>
  )
}
