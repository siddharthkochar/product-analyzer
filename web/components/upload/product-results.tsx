'use client'

import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, Save, RefreshCw } from 'lucide-react'
import type { Product } from '@/types/product'

interface ProductResultsProps {
  product: Partial<Product> & { nutrition?: any }
  onSave: (editedProduct: Partial<Product> & { nutrition?: any }) => void
  onTryAnother: () => void
  isSaving: boolean
}

interface ProductFormValues {
  productName: string
  brand: string
  category: string
  subCategory: string
  expiryDate: string
  mrp: string
  weight: string
  quantity: number
  ingredients: string
}

export function ProductResults({
  product,
  onSave,
  onTryAnother,
  isSaving,
}: ProductResultsProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormValues>({
    defaultValues: {
      productName: product.productName || '',
      brand: product.brand || '',
      category: product.category || '',
      subCategory: product.subCategory || '',
      expiryDate: product.expiryDate || '',
      mrp: product.mrp || '',
      weight: product.weight || '',
      quantity: product.quantity || 1,
      ingredients: product.ingredients || '',
    },
  })

  const onSubmit = (data: ProductFormValues) => {
    // Merge form data with non-editable fields from original product
    // This preserves nutrition and other non-form fields from the original product
    const updatedProduct: Partial<Product> & { nutrition?: any } = {
      ...product,
      ...data,
    }
    console.log('[ProductResults] Submitting product with nutrition:', updatedProduct.nutrition ? 'YES' : 'NO')
    onSave(updatedProduct)
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2 justify-center">
        <CheckCircle className="h-6 w-6 text-green-500" />
        <h2 className="text-2xl font-bold">Analysis Complete</h2>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-4">Edit Product Information</h3>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="productName">
                  Product Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="productName"
                  {...register('productName', { required: 'Product name is required' })}
                  placeholder="Enter product name"
                  className="mt-1"
                />
                {errors.productName && (
                  <p className="text-sm text-destructive mt-1">{errors.productName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    {...register('brand')}
                    placeholder="Enter brand"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    {...register('category')}
                    placeholder="e.g., Snacks, Dairy"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="subCategory">Sub-category</Label>
                <Input
                  id="subCategory"
                  {...register('subCategory')}
                  placeholder="e.g., Biscuits, Chips"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiryDate">
                    Expiry Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    {...register('expiryDate', { required: 'Expiry date is required' })}
                    className="mt-1"
                  />
                  {errors.expiryDate && (
                    <p className="text-sm text-destructive mt-1">{errors.expiryDate.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    {...register('quantity', { valueAsNumber: true })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weight">Weight</Label>
                  <Input
                    id="weight"
                    {...register('weight')}
                    placeholder="e.g., 500g, 1L"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="mrp">MRP</Label>
                  <Input
                    id="mrp"
                    {...register('mrp')}
                    placeholder="e.g., ₹150"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="ingredients">Ingredients</Label>
                <textarea
                  id="ingredients"
                  {...register('ingredients')}
                  placeholder="Enter ingredients (comma-separated)"
                  className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {product.healthScore !== undefined && product.healthScore > 0 && (
            <div className="border-t pt-4">
              <Label className="text-sm font-medium text-muted-foreground">Health Score</Label>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${product.healthScore}%` }}
                  />
                </div>
                <span className="text-lg font-semibold">{product.healthScore}/100</span>
              </div>
              {product.healthRating && (
                <p className="text-sm text-muted-foreground mt-1">
                  Rating: {product.healthRating}
                </p>
              )}
            </div>
          )}

          {product.concerns && (
            <div className="border-t pt-4">
              <Label className="text-sm font-medium text-muted-foreground">Health Concerns</Label>
              <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                {product.concerns}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button
              type="button"
              onClick={onTryAnother}
              variant="outline"
              disabled={isSaving}
              className="h-14 sm:h-12 w-full sm:w-auto text-base sm:text-sm"
              aria-label="Analyze another product"
            >
              <RefreshCw className="mr-2 h-6 w-6 sm:h-5 sm:w-5" />
              Try Another Product
            </Button>

            <Button
              type="submit"
              disabled={isSaving}
              className="h-14 sm:h-12 w-full sm:w-auto sm:min-w-[200px] text-base sm:text-sm"
              aria-label="Save product to inventory"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="mr-2 h-6 w-6 sm:h-5 sm:w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-6 w-6 sm:h-5 sm:w-5" />
                  Save to Inventory
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
