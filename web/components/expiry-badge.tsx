import { Badge } from '@/components/ui/badge'
import { AlertCircle, Clock, CheckCircle } from 'lucide-react'

interface ExpiryBadgeProps {
  daysToExpire: number
  expiryDate: string
}

export function ExpiryBadge({ daysToExpire, expiryDate }: ExpiryBadgeProps) {
  const getExpiryStatus = () => {
    if (daysToExpire < 0) {
      const daysExpired = Math.abs(daysToExpire)
      return {
        text: `Expired ${daysExpired} day${daysExpired === 1 ? '' : 's'} ago`,
        variant: 'destructive' as const,
        icon: AlertCircle,
        className: 'bg-red-100 text-red-800 hover:bg-red-100',
      }
    }

    if (daysToExpire === 0) {
      return {
        text: 'Expires today',
        variant: 'destructive' as const,
        icon: AlertCircle,
        className: 'bg-red-100 text-red-800 hover:bg-red-100',
      }
    }

    if (daysToExpire === 1) {
      return {
        text: 'Expires tomorrow',
        variant: 'secondary' as const,
        icon: Clock,
        className: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
      }
    }

    if (daysToExpire <= 7) {
      return {
        text: `${daysToExpire} days`,
        variant: 'secondary' as const,
        icon: Clock,
        className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
      }
    }

    if (daysToExpire <= 30) {
      const weeks = Math.floor(daysToExpire / 7)
      const days = daysToExpire % 7
      const text = weeks > 0
        ? `${weeks} week${weeks > 1 ? 's' : ''}${days > 0 ? ` ${days} day${days > 1 ? 's' : ''}` : ''}`
        : `${days} day${days > 1 ? 's' : ''}`

      return {
        text,
        variant: 'outline' as const,
        icon: Clock,
        className: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
      }
    }

    // More than 30 days
    const months = Math.floor(daysToExpire / 30)
    const remainingDays = daysToExpire % 30
    const text = months > 0
      ? `${months} month${months > 1 ? 's' : ''}${remainingDays > 0 ? ` ${remainingDays} day${remainingDays > 1 ? 's' : ''}` : ''}`
      : `${daysToExpire} days`

    return {
      text,
      variant: 'default' as const,
      icon: CheckCircle,
      className: 'bg-green-100 text-green-800 hover:bg-green-100',
    }
  }

  const status = getExpiryStatus()
  const Icon = status.icon

  return (
    <Badge variant={status.variant} className={`${status.className} flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {status.text}
    </Badge>
  )
}
