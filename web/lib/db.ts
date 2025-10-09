import { createClient } from '@supabase/supabase-js'
import type { Product } from '@/types/product'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Calculate days to expire from expiry date
 */
function calculateDaysToExpire(expiryDate: string | null): number {
  if (!expiryDate) return 0

  const expiry = new Date(expiryDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  expiry.setHours(0, 0, 0, 0)

  const diffTime = expiry.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

/**
 * Convert database row to Product type (camelCase)
 */
function dbRowToProduct(row: any): Product {
  return {
    id: row.id,
    productName: row.product_name,
    brand: row.brand,
    category: row.category,
    subCategory: row.sub_category,
    expiryDate: row.expiry_date || '',
    daysToExpire: calculateDaysToExpire(row.expiry_date),
    mrp: row.mrp || '',
    weight: row.weight || '',
    ingredients: row.ingredients || '',
    nutritionalInfo: row.nutritional_info || '',
    healthScore: row.health_score || 0,
    healthRating: row.health_rating || '',
    concerns: row.concerns || '',
    quantity: row.quantity || 1,
    dateAdded: row.date_added || new Date().toISOString(),
  }
}

/**
 * Convert Product to database row (snake_case)
 */
function productToDbRow(product: Partial<Product>) {
  return {
    product_name: product.productName,
    brand: product.brand,
    category: product.category,
    sub_category: product.subCategory,
    expiry_date: product.expiryDate,
    mrp: product.mrp,
    weight: product.weight,
    ingredients: product.ingredients,
    nutritional_info: product.nutritionalInfo,
    health_score: product.healthScore,
    health_rating: product.healthRating,
    concerns: product.concerns,
    quantity: product.quantity,
    date_added: product.dateAdded,
  }
}

/**
 * Get all products from database
 */
export async function getAllProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('date_added', { ascending: false })

    if (error) {
      console.error('Supabase getAllProducts error:', error)
      throw new Error(`Failed to fetch products: ${error.message}`)
    }

    return (data || []).map(dbRowToProduct)
  } catch (error) {
    console.error('getAllProducts error:', error)
    throw error
  }
}

/**
 * Get a single product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null
      }
      console.error('Supabase getProductById error:', error)
      throw new Error(`Failed to fetch product: ${error.message}`)
    }

    return data ? dbRowToProduct(data) : null
  } catch (error) {
    console.error('getProductById error:', error)
    throw error
  }
}

/**
 * Check if a product with the same name and brand exists
 */
export async function checkDuplicate(
  productName: string,
  brand: string
): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .ilike('product_name', productName)
      .ilike('brand', brand)
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found - no duplicate
        return null
      }
      console.error('Supabase checkDuplicate error:', error)
      throw new Error(`Failed to check duplicate: ${error.message}`)
    }

    return data ? dbRowToProduct(data) : null
  } catch (error) {
    console.error('checkDuplicate error:', error)
    // Don't throw on duplicate check - just return null
    return null
  }
}

/**
 * Add a new product to database
 */
export async function addProduct(product: Partial<Product>): Promise<Product> {
  try {
    const dbRow = productToDbRow(product)

    const { data, error } = await supabase
      .from('products')
      .insert([dbRow])
      .select()
      .single()

    if (error) {
      console.error('Supabase addProduct error:', error)
      throw new Error(`Failed to add product: ${error.message}`)
    }

    return dbRowToProduct(data)
  } catch (error) {
    console.error('addProduct error:', error)
    throw error
  }
}

/**
 * Update an existing product
 */
export async function updateProduct(
  id: string,
  updates: Partial<Product>
): Promise<Product> {
  try {
    const dbRow = productToDbRow(updates)

    const { data, error } = await supabase
      .from('products')
      .update(dbRow)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Supabase updateProduct error:', error)
      throw new Error(`Failed to update product: ${error.message}`)
    }

    return dbRowToProduct(data)
  } catch (error) {
    console.error('updateProduct error:', error)
    throw error
  }
}

/**
 * Delete a product by ID
 */
export async function deleteProduct(id: string): Promise<void> {
  try {
    const { error } = await supabase.from('products').delete().eq('id', id)

    if (error) {
      console.error('Supabase deleteProduct error:', error)
      throw new Error(`Failed to delete product: ${error.message}`)
    }
  } catch (error) {
    console.error('deleteProduct error:', error)
    throw error
  }
}

/**
 * Search products by name, brand, or category
 */
export async function searchProducts(query: string): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(
        `product_name.ilike.%${query}%,brand.ilike.%${query}%,category.ilike.%${query}%`
      )
      .order('date_added', { ascending: false })

    if (error) {
      console.error('Supabase searchProducts error:', error)
      throw new Error(`Failed to search products: ${error.message}`)
    }

    return (data || []).map(dbRowToProduct)
  } catch (error) {
    console.error('searchProducts error:', error)
    throw error
  }
}

/**
 * Get products expiring soon (within specified days)
 */
export async function getExpiringProducts(days: number = 30): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .lte('days_to_expire', days)
      .gte('days_to_expire', 0)
      .order('days_to_expire', { ascending: true })

    if (error) {
      console.error('Supabase getExpiringProducts error:', error)
      throw new Error(`Failed to fetch expiring products: ${error.message}`)
    }

    return (data || []).map(dbRowToProduct)
  } catch (error) {
    console.error('getExpiringProducts error:', error)
    throw error
  }
}

/**
 * Get total count of products
 */
export async function getProductCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('Supabase getProductCount error:', error)
      throw new Error(`Failed to count products: ${error.message}`)
    }

    return count || 0
  } catch (error) {
    console.error('getProductCount error:', error)
    return 0
  }
}

export { supabase }
