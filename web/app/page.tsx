'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Product } from '@/types/product'
import { ProductTable } from '@/components/product-table'
import { Button } from '@/components/ui/button'
import { Plus, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { EditProductDialog } from '@/components/edit-product-dialog'
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog'
import { ConsumeProductDialog } from '@/components/consume-product-dialog'
import { useToast } from '@/hooks/use-toast'

export default function Home() {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  const [consumingProduct, setConsumingProduct] = useState<Product | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch products
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await fetch('/api/products')
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      const result = await response.json()
      return result.data as Product[]
    },
  })

  // Update product mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Product> }) => {
      const response = await fetch('/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowId: id, data }),
      })
      if (!response.ok) throw new Error('Failed to update product')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast({
        title: 'Success',
        description: 'Product updated successfully',
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update product',
        variant: 'destructive',
      })
    },
  })

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowId: id }),
      })
      if (!response.ok) throw new Error('Failed to delete product')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast({
        title: 'Success',
        description: 'Product deleted successfully',
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete product',
        variant: 'destructive',
      })
    },
  })

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
  }

  const handleDelete = (product: Product) => {
    setDeletingProduct(product)
  }

  const handleMarkConsumed = (product: Product) => {
    setConsumingProduct(product)
  }

  const handleUpdateProduct = async (data: Partial<Product>) => {
    if (editingProduct) {
      await updateMutation.mutateAsync({ id: editingProduct.id, data })
      setEditingProduct(null)
    }
  }

  const handleDeleteProduct = async () => {
    if (deletingProduct) {
      await deleteMutation.mutateAsync(deletingProduct.id)
      setDeletingProduct(null)
    }
  }

  const handleConsumeProduct = async (quantityConsumed: number) => {
    if (consumingProduct) {
      const newQuantity = consumingProduct.quantity - quantityConsumed
      if (newQuantity <= 0) {
        // Delete if quantity reaches 0
        await deleteMutation.mutateAsync(consumingProduct.id)
      } else {
        // Update quantity
        await updateMutation.mutateAsync({
          id: consumingProduct.id,
          data: { quantity: newQuantity },
        })
      }
      setConsumingProduct(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-destructive">Failed to load products</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['products'] })}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link href="/upload">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <p className="text-muted-foreground text-lg">No products yet</p>
          <Link href="/upload">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Product
            </Button>
          </Link>
        </div>
      ) : (
        <ProductTable
          products={products}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onMarkConsumed={handleMarkConsumed}
        />
      )}

      {/* Dialogs */}
      <EditProductDialog
        product={editingProduct}
        open={!!editingProduct}
        onOpenChange={(open) => !open && setEditingProduct(null)}
        onSave={handleUpdateProduct}
      />
      <DeleteConfirmDialog
        product={deletingProduct}
        open={!!deletingProduct}
        onOpenChange={(open) => !open && setDeletingProduct(null)}
        onConfirm={handleDeleteProduct}
      />
      <ConsumeProductDialog
        product={consumingProduct}
        open={!!consumingProduct}
        onOpenChange={(open) => !open && setConsumingProduct(null)}
        onConfirm={handleConsumeProduct}
      />
    </div>
  )
}
