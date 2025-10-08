import { NextRequest, NextResponse } from 'next/server'
import { updateProduct } from '@/lib/google-sheets'
import { Product } from '@/types/product'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { rowId, data } = body as { rowId: string; data: Partial<Product> }

    if (!rowId) {
      return NextResponse.json(
        { success: false, error: 'Row ID is required' },
        { status: 400 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Update data is required' },
        { status: 400 }
      )
    }

    await updateProduct(rowId, data)

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
    })
  } catch (error) {
    console.error('Update product error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update product',
      },
      { status: 500 }
    )
  }
}
