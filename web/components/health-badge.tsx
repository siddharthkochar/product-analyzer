import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface HealthBadgeProps {
  healthScore: number
  healthRating: string
  concerns?: string
}

export function HealthBadge({ healthScore, healthRating, concerns }: HealthBadgeProps) {
  // Determine badge variant based on health score
  const getVariant = () => {
    if (healthScore >= 80) return 'default' // Green - Healthy
    if (healthScore >= 60) return 'secondary' // Yellow - Moderate
    if (healthScore >= 40) return 'outline' // Orange - Not Healthy
    return 'destructive' // Red - Harmful
  }

  const getBackgroundColor = () => {
    if (healthScore >= 80) return 'bg-green-100 text-green-800 hover:bg-green-100'
    if (healthScore >= 60) return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
    if (healthScore >= 40) return 'bg-orange-100 text-orange-800 hover:bg-orange-100'
    return 'bg-red-100 text-red-800 hover:bg-red-100'
  }

  // Parse concerns if it's a string (could be comma-separated or newline-separated)
  const concernsList = concerns
    ? concerns
        .split(/[,\n]/)
        .map((c) => c.trim())
        .filter((c) => c.length > 0)
    : []

  const badge = (
    <Badge variant={getVariant()} className={getBackgroundColor()}>
      {healthRating} ({healthScore})
    </Badge>
  )

  // Only show tooltip if there are concerns
  if (concernsList.length === 0) {
    return badge
  }

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
