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

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          onClick={onRetake}
          variant="outline"
          disabled={isAnalyzing}
          className="h-14 sm:h-12 w-full sm:w-auto text-base sm:text-sm"
          aria-label="Change image"
        >
          <RotateCcw className="mr-2 h-6 w-6 sm:h-5 sm:w-5" />
          Change Image
        </Button>

        <Button
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className="h-14 sm:h-12 w-full sm:w-auto sm:min-w-[200px] text-base sm:text-sm"
          aria-label="Analyze product image"
        >
          <Camera className="mr-2 h-6 w-6 sm:h-5 sm:w-5" />
          Analyze Product
        </Button>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Review your image and click Analyze Product to extract product information
      </p>
    </div>
  )
}
