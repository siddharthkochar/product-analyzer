'use client'

import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'

interface SearchFilterProps {
  search: string
  onSearchChange: (value: string) => void
  category: string
  onCategoryChange: (value: string) => void
  healthRating: string
  onHealthRatingChange: (value: string) => void
  expiryStatus: string
  onExpiryStatusChange: (value: string) => void
  onClearFilters: () => void
  categories: string[]
}

export function SearchFilter({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  healthRating,
  onHealthRatingChange,
  expiryStatus,
  onExpiryStatusChange,
  onClearFilters,
  categories,
}: SearchFilterProps) {
  const hasActiveFilters = search || category !== 'all' || healthRating !== 'all' || expiryStatus !== 'all'

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products or ingredients..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filter Selects */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Category Filter */}
          <Select value={category} onValueChange={onCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Health Rating Filter */}
          <Select value={healthRating} onValueChange={onHealthRatingChange}>
            <SelectTrigger>
              <SelectValue placeholder="All Health Ratings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Health Ratings</SelectItem>
              <SelectItem value="Healthy">Healthy (80-100)</SelectItem>
              <SelectItem value="Moderate">Moderate (60-79)</SelectItem>
              <SelectItem value="Not Healthy">Not Healthy (40-59)</SelectItem>
              <SelectItem value="Harmful">Harmful (0-39)</SelectItem>
            </SelectContent>
          </Select>

          {/* Expiry Status Filter */}
          <Select value={expiryStatus} onValueChange={onExpiryStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="All Expiry Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Expiry Status</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="expiring-soon">Expiring Soon (7 days)</SelectItem>
              <SelectItem value="expiring-month">Expiring This Month</SelectItem>
              <SelectItem value="fresh">Fresh (30+ days)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
