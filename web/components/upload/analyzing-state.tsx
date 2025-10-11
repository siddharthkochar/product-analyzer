'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, RotateCcw } from 'lucide-react'

interface AnalyzingStateProps {
  preview: string
  onCancel?: () => void
}

export function AnalyzingState({ preview, onCancel }: AnalyzingStateProps) {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card className="overflow-hidden relative">
        <div className="relative w-full aspect-video bg-muted">
          <img
            src={preview}
            alt="Product being analyzed"
            className="w-full h-full object-contain opacity-50"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-sm">
            <div className="text-center space-y-4">
              <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
              <div>
                <p className="text-lg font-semibold" role="status" aria-live="polite">
                  Analyzing Product...
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Extracting product information from image
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          This may take a few moments. Please wait...
        </p>
        {onCancel && (
          <Button
            onClick={onCancel}
            variant="outline"
            size="sm"
            className="text-sm"
            aria-label="Cancel analysis and change image"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Change Image
          </Button>
        )}
      </div>
    </div>
  )
}
