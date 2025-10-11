'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertCircle, RotateCcw, Upload } from 'lucide-react'

interface AnalysisErrorProps {
  error: string
  onRetry: () => void
  onUseNewImage: () => void
}

export function AnalysisError({ error, onRetry, onUseNewImage }: AnalysisErrorProps) {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card className="p-8 text-center space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-2">Analysis Failed</h2>
          <p className="text-muted-foreground" role="alert" aria-live="assertive">
            {error}
          </p>
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          onClick={onUseNewImage}
          variant="outline"
          className="h-14 sm:h-12 w-full sm:w-auto text-base sm:text-sm"
          aria-label="Upload a different image"
        >
          <Upload className="mr-2 h-6 w-6 sm:h-5 sm:w-5" />
          Use Different Image
        </Button>

        <Button
          onClick={onRetry}
          className="h-14 sm:h-12 w-full sm:w-auto sm:min-w-[200px] text-base sm:text-sm"
          aria-label="Try analyzing again"
        >
          <RotateCcw className="mr-2 h-6 w-6 sm:h-5 sm:w-5" />
          Try Again
        </Button>
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Make sure the product label is clearly visible and well-lit
        </p>
      </div>
    </div>
  )
}
