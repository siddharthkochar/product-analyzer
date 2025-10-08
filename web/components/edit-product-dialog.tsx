'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Product } from '@/types/product'
import { productFormSchema, ProductFormValues } from '@/lib/validations'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

interface EditProductDialogProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: ProductFormValues) => Promise<void>
  isLoading?: boolean
}

export function EditProductDialog({
  product,
  open,
  onOpenChange,
  onSave,
  isLoading,
}: EditProductDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    values: product
      ? {
          productName: product.productName,
          brand: product.brand,
          category: product.category,
          subCategory: product.subCategory,
          expiryDate: product.expiryDate,
          mrp: product.mrp,
          weight: product.weight,
          ingredients: product.ingredients,
          nutritionalInfo: product.nutritionalInfo,
          quantity: product.quantity,
        }
      : undefined,
  })

  const onSubmit = async (data: ProductFormValues) => {
    await onSave(data)
    reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Update product information. Click save when you're done.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Product Name */}
            <div className="col-span-2">
              <Label htmlFor="productName">Product Name *</Label>
              <Input
                id="productName"
                {...register('productName')}
                className={errors.productName ? 'border-red-500' : ''}
              />
              {errors.productName && (
                <p className="text-sm text-red-500 mt-1">{errors.productName.message}</p>
              )}
            </div>

            {/* Brand */}
            <div>
              <Label htmlFor="brand">Brand *</Label>
              <Input
                id="brand"
                {...register('brand')}
                className={errors.brand ? 'border-red-500' : ''}
              />
              {errors.brand && (
                <p className="text-sm text-red-500 mt-1">{errors.brand.message}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                {...register('category')}
                className={errors.category ? 'border-red-500' : ''}
              />
              {errors.category && (
                <p className="text-sm text-red-500 mt-1">{errors.category.message}</p>
              )}
            </div>

            {/* Sub-Category */}
            <div>
              <Label htmlFor="subCategory">Sub-Category *</Label>
              <Input
                id="subCategory"
                {...register('subCategory')}
                className={errors.subCategory ? 'border-red-500' : ''}
              />
              {errors.subCategory && (
                <p className="text-sm text-red-500 mt-1">{errors.subCategory.message}</p>
              )}
            </div>

            {/* Expiry Date */}
            <div>
              <Label htmlFor="expiryDate">Expiry Date *</Label>
              <Input
                id="expiryDate"
                type="date"
                {...register('expiryDate')}
                className={errors.expiryDate ? 'border-red-500' : ''}
              />
              {errors.expiryDate && (
                <p className="text-sm text-red-500 mt-1">{errors.expiryDate.message}</p>
              )}
            </div>

            {/* MRP */}
            <div>
              <Label htmlFor="mrp">MRP *</Label>
              <Input
                id="mrp"
                {...register('mrp')}
                placeholder="e.g., ₹299"
                className={errors.mrp ? 'border-red-500' : ''}
              />
              {errors.mrp && (
                <p className="text-sm text-red-500 mt-1">{errors.mrp.message}</p>
              )}
            </div>

            {/* Weight */}
            <div>
              <Label htmlFor="weight">Weight/Quantity *</Label>
              <Input
                id="weight"
                {...register('weight')}
                placeholder="e.g., 500g, 1L"
                className={errors.weight ? 'border-red-500' : ''}
              />
              {errors.weight && (
                <p className="text-sm text-red-500 mt-1">{errors.weight.message}</p>
              )}
            </div>

            {/* Quantity */}
            <div>
              <Label htmlFor="quantity">Quantity (Items) *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                {...register('quantity', { valueAsNumber: true })}
                className={errors.quantity ? 'border-red-500' : ''}
              />
              {errors.quantity && (
                <p className="text-sm text-red-500 mt-1">{errors.quantity.message}</p>
              )}
            </div>

            {/* Ingredients */}
            <div className="col-span-2">
              <Label htmlFor="ingredients">Ingredients</Label>
              <Input
                id="ingredients"
                {...register('ingredients')}
                placeholder="Comma-separated list"
              />
            </div>

            {/* Nutritional Info */}
            <div className="col-span-2">
              <Label htmlFor="nutritionalInfo">Nutritional Information</Label>
              <Input
                id="nutritionalInfo"
                {...register('nutritionalInfo')}
                placeholder="Per 100g/100ml"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
