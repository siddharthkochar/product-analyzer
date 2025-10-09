import { NextResponse } from 'next/server'
import { getAllProducts, addProduct, checkDuplicate } from '@/lib/db'
import type { Product } from '@/types/product'

export async function GET() {
  try {
    const products = await getAllProducts()
    return NextResponse.json({ success: true, data: products })
  } catch (error) {
    console.error('GET /api/products error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const productData: Partial<Product> = body

    // Validate required fields
    if (!productData.productName) {
      return NextResponse.json(
        { success: false, error: 'Product name is required' },
        { status: 400 }
      )
    }

    // Check for duplicates
    const duplicate = await checkDuplicate(
      productData.productName,
      productData.brand || 'Unknown'
    )

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product already exists in inventory',
          duplicate,
        },
        { status: 409 }
      )
    }

    // Add product to database
    const newProduct = await addProduct({
      ...productData,
      dateAdded: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: 'Product added successfully',
      data: newProduct,
    })
  } catch (error) {
    console.error('POST /api/products error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add product' },
      { status: 500 }
    )
  }
}
