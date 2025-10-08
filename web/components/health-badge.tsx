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
    <Badge variant="outline" className={getBadgeClass()}>
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
