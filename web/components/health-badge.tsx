'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface HealthBadgeProps {
  healthScore: number
  healthRating: string
  concerns?: string
}

export function HealthBadge({ healthScore, healthRating, concerns }: HealthBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  // Detect touch device
  useEffect(() => {
    const checkTouchDevice = () => {
      return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore - for older browsers
        navigator.msMaxTouchPoints > 0
      )
    }
    setIsTouchDevice(checkTouchDevice())
  }, [])

  // Determine badge class based on health score (using CSS variables for dark mode support)
  const getBadgeClass = () => {
    if (healthScore >= 80) return 'health-badge-excellent'
    if (healthScore >= 60) return 'health-badge-good'
    if (healthScore >= 40) return 'health-badge-fair'
    return 'health-badge-poor'
  }

  // Parse concerns if it's a string (could be comma-separated or newline-separated)
  const concernsList = concerns
    ? concerns
        .split(/[,\n]/)
        .map((c) => c.trim())
        .filter((c) => c.length > 0)
    : []

  const badge = (
    <Badge
      variant="outline"
      className={`${getBadgeClass()} ${isTouchDevice && concernsList.length > 0 ? 'cursor-pointer select-none' : ''} inline-flex items-center gap-1`}
      onClick={isTouchDevice && concernsList.length > 0 ? () => setIsExpanded(!isExpanded) : undefined}
      role={isTouchDevice && concernsList.length > 0 ? 'button' : undefined}
      aria-expanded={isTouchDevice && concernsList.length > 0 ? isExpanded : undefined}
      tabIndex={isTouchDevice && concernsList.length > 0 ? 0 : undefined}
      onKeyDown={
        isTouchDevice && concernsList.length > 0
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setIsExpanded(!isExpanded)
              }
            }
          : undefined
      }
    >
      {healthRating} ({healthScore})
      {isTouchDevice && concernsList.length > 0 && (
        <>
          {isExpanded ? (
            <ChevronUp className="h-3 w-3 ml-1" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-3 w-3 ml-1" aria-hidden="true" />
          )}
        </>
      )}
    </Badge>
  )

  // Only show tooltip if there are concerns
  if (concernsList.length === 0) {
    return badge
  }

  // Mobile view: expandable card
  if (isTouchDevice) {
    return (
      <div className="inline-block">
        {badge}
        {isExpanded && (
          <Card className={`mt-2 ${getBadgeClass()} border-2 animate-in slide-in-from-top-2 duration-200`}>
            <CardContent className="p-3">
              <div className="space-y-2">
                <p className="font-semibold text-sm">Health Concerns:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  {concernsList.map((concern, index) => (
                    <li key={index}>{concern}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // Desktop view: tooltip on hover
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold text-sm">Concerns:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              {concernsList.map((concern, index) => (
                <li key={index}>{concern}</li>
              ))}
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
