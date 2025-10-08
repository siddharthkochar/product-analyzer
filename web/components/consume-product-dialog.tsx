'use client'

import { useState } from 'react'
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
import { MinusCircle } from 'lucide-react'
import { Product } from '@/types/product'

interface ConsumeProductDialogProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (quantityConsumed: number) => Promise<void>
}

export function ConsumeProductDialog({
  product,
  open,
  onOpenChange,
  onConfirm,
}: ConsumeProductDialogProps) {
  const [quantity, setQuantity] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirm = async () => {
    if (!product || quantity <= 0 || quantity > product.quantity) return

    setIsSubmitting(true)
    try {
      await onConfirm(quantity)
      setQuantity(1)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <MinusCircle className="h-5 w-5 text-orange-500" />
            <DialogTitle>Mark as Consumed</DialogTitle>
          </div>
          <DialogDescription>
            How many units of this product have been consumed?
          </DialogDescription>
        </DialogHeader>

        {product && (
          <div className="space-y-4 py-4">
            <div className="rounded-lg border p-4 space-y-2">
              <p className="font-semibold">{product.productName}</p>
              <p className="text-sm text-muted-foreground">
                Brand: {product.brand} | Available: {product.quantity} unit(s)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity Consumed</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                max={product.quantity}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
              <p className="text-xs text-muted-foreground">
                Remaining: {product.quantity - quantity} unit(s)
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting || !product || quantity <= 0 || quantity > product.quantity}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
