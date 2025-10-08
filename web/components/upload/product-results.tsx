'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Save, RefreshCw } from 'lucide-react'
import type { Product } from '@/types/product'

interface ProductResultsProps {
  product: Partial<Product>
  onSave: () => void
  onTryAnother: () => void
  isSaving: boolean
}

export function ProductResults({
  product,
  onSave,
  onTryAnother,
  isSaving,
}: ProductResultsProps) {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2 justify-center">
        <CheckCircle className="h-6 w-6 text-green-500" />
        <h2 className="text-2xl font-bold">Analysis Complete</h2>
      </div>

      <Card className="p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-4">Product Information</h3>
          <div className="grid gap-4">
            {product.productName && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Product Name
                </label>
                <p className="text-base mt-1">{product.productName}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {product.brand && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Brand
                  </label>
                  <p className="text-base mt-1">{product.brand}</p>
                </div>
              )}

              {product.category && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Category
                  </label>
                  <Badge variant="secondary" className="mt-1">
                    {product.category}
                  </Badge>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {product.weight && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Weight
                  </label>
                  <p className="text-base mt-1">{product.weight}</p>
                </div>
              )}

              {product.mrp && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    MRP
                  </label>
                  <p className="text-base mt-1">{product.mrp}</p>
                </div>
              )}
            </div>

            {product.expiryDate && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Expiry Date
                </label>
                <p className="text-base mt-1">{product.expiryDate}</p>
              </div>
            )}

            {product.quantity !== undefined && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Quantity
                </label>
                <p className="text-base mt-1">{product.quantity}</p>
              </div>
            )}

            {product.ingredients && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Ingredients
                </label>
                <p className="text-sm mt-1 text-muted-foreground line-clamp-3">
                  {product.ingredients}
                </p>
              </div>
            )}
          </div>
        </div>

        {product.healthScore !== undefined && product.healthScore > 0 && (
          <div className="border-t pt-4">
            <label className="text-sm font-medium text-muted-foreground">
              Health Score
            </label>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex-1 bg-muted rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${product.healthScore}%` }}
                />
              </div>
              <span className="text-lg font-semibold">{product.healthScore}/100</span>
            </div>
          </div>
        )}
      </Card>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          onClick={onTryAnother}
          variant="outline"
          size="lg"
          disabled={isSaving}
          className="flex-1 sm:flex-initial"
          aria-label="Analyze another product"
        >
          <RefreshCw className="mr-2 h-5 w-5" />
          Try Another Product
        </Button>

        <Button
          onClick={onSave}
          size="lg"
          disabled={isSaving}
          className="flex-1 sm:flex-initial min-w-[200px]"
          aria-label="Save product to inventory"
        >
          {isSaving ? (
            <>
              <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-5 w-5" />
              Save to Inventory
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
