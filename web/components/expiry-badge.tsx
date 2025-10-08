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
        icon: AlertCircle,
        className: 'expiry-badge-expired',
      }
    }

    if (daysToExpire === 0) {
      return {
        text: 'Expires today',
        icon: AlertCircle,
        className: 'expiry-badge-expired',
      }
    }

    if (daysToExpire === 1) {
      return {
        text: 'Expires tomorrow',
        icon: Clock,
        className: 'expiry-badge-critical',
      }
    }

    if (daysToExpire <= 7) {
      return {
        text: `${daysToExpire} days`,
        icon: Clock,
        className: 'expiry-badge-warning',
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
        icon: Clock,
        className: 'expiry-badge-soon',
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
      icon: CheckCircle,
      className: 'expiry-badge-fresh',
    }
  }

  const status = getExpiryStatus()
  const Icon = status.icon

  return (
    <Badge variant="outline" className={`${status.className} flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {status.text}
    </Badge>
  )
}
