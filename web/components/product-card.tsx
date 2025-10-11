'use client'

import { Product } from '@/types/product'
import { HealthBadge } from '@/components/health-badge'
import { ExpiryBadge } from '@/components/expiry-badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Edit, MoreHorizontal, Trash, MinusCircle } from 'lucide-react'

interface ProductCardProps {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
  onMarkConsumed: (product: Product) => void
}

export function ProductCard({ product, onEdit, onDelete, onMarkConsumed }: ProductCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight truncate">{product.productName}</h3>
            {product.brand && (
              <p className="text-sm text-muted-foreground mt-0.5">{product.brand}</p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 flex-shrink-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit(product)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onMarkConsumed(product)}>
                <MinusCircle className="mr-2 h-4 w-4" />
                Mark as Consumed
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(product)}
                className="text-destructive focus:text-destructive"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-4">
        {/* Health and Expiry Badges */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Health</p>
            <HealthBadge
              healthScore={product.healthScore}
              healthRating={product.healthRating}
              concerns={product.concerns}
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Expiry</p>
            <ExpiryBadge daysToExpire={product.daysToExpire} expiryDate={product.expiryDate} />
          </div>
        </div>

        {/* Category and Subcategory */}
        {(product.category || product.subCategory) && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Category:</span>
            <div className="flex items-center gap-1">
              {product.category && <span className="font-medium">{product.category}</span>}
              {product.category && product.subCategory && (
                <span className="text-muted-foreground">•</span>
              )}
              {product.subCategory && (
                <span className="text-muted-foreground">{product.subCategory}</span>
              )}
            </div>
          </div>
        )}

        {/* Bottom row: Quantity, Price, Weight */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Quantity</p>
              <p className="font-semibold text-base">{product.quantity}</p>
            </div>
            {product.mrp && (
              <div>
                <p className="text-xs text-muted-foreground">Price</p>
                <p className="font-semibold text-base">{product.mrp}</p>
              </div>
            )}
          </div>
          {product.weight && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Weight</p>
              <p className="text-sm font-medium">{product.weight}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
