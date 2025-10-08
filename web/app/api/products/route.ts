import { NextResponse } from 'next/server'
import { getAllProducts } from '@/lib/google-sheets'

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
