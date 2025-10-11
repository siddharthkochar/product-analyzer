'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Product } from '@/types/product'
import { ProductTable } from '@/components/product-table'
import { SearchFilter } from '@/components/search-filter'
import { Button } from '@/components/ui/button'
import { Plus, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useMemo } from 'react'
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

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [healthFilter, setHealthFilter] = useState('all')
  const [expiryFilter, setExpiryFilter] = useState('all')

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

  // Helper function to get expiry status from days to expire
  const getExpiryStatus = (daysToExpire: number): string => {
    if (daysToExpire < 0) return 'expired'
    if (daysToExpire <= 7) return 'expiring-soon'
    if (daysToExpire <= 30) return 'expiring-month'
    return 'fresh'
  }

  // Extract unique categories from products
  const categories = useMemo(() => {
    const unique = new Set(products.map((p) => p.category))
    return Array.from(unique).sort()
  }, [products])

  // Filter products based on search and filter criteria
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Search: name, brand, ingredients, category
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch =
        !searchQuery ||
        product.productName.toLowerCase().includes(searchLower) ||
        product.brand.toLowerCase().includes(searchLower) ||
        product.ingredients?.toLowerCase().includes(searchLower) ||
        product.category.toLowerCase().includes(searchLower)

      // Category filter
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter

      // Health rating filter
      const matchesHealth = healthFilter === 'all' || product.healthRating === healthFilter

      // Expiry status filter
      const expiryStatus = getExpiryStatus(product.daysToExpire)
      const matchesExpiry = expiryFilter === 'all' || expiryStatus === expiryFilter

      return matchesSearch && matchesCategory && matchesHealth && matchesExpiry
    })
  }, [products, searchQuery, categoryFilter, healthFilter, expiryFilter])

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('')
    setCategoryFilter('all')
    setHealthFilter('all')
    setExpiryFilter('all')
  }

  // Check if any filters are active
  const hasActiveFilters = searchQuery || categoryFilter !== 'all' || healthFilter !== 'all' || expiryFilter !== 'all'

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
            Scan Product
          </Button>
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <p className="text-muted-foreground text-lg">No products yet</p>
          <Link href="/upload">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Scan Your First Product
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Search and Filter */}
          <SearchFilter
            search={searchQuery}
            onSearchChange={setSearchQuery}
            category={categoryFilter}
            onCategoryChange={setCategoryFilter}
            healthRating={healthFilter}
            onHealthRatingChange={setHealthFilter}
            expiryStatus={expiryFilter}
            onExpiryStatusChange={setExpiryFilter}
            onClearFilters={handleClearFilters}
            categories={categories}
          />

          {/* Results Count */}
          {hasActiveFilters && (
            <div className="text-sm text-muted-foreground">
              Showing {filteredProducts.length} of {products.length} products
            </div>
          )}

          {/* Products Table or Empty State */}
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 border-2 border-dashed rounded-lg p-8">
              <p className="text-muted-foreground text-lg">No products match your filters</p>
              <Button onClick={handleClearFilters} variant="outline">
                Clear Filters
              </Button>
            </div>
          ) : (
            <ProductTable
              products={filteredProducts}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onMarkConsumed={handleMarkConsumed}
            />
          )}
        </div>
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
