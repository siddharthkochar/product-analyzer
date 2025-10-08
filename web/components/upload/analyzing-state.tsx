'use client'

import { Card } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface AnalyzingStateProps {
  preview: string
}

export function AnalyzingState({ preview }: AnalyzingStateProps) {
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

      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          This may take a few moments. Please wait...
        </p>
      </div>
    </div>
  )
}
