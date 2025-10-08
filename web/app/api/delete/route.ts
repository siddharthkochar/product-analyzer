import { NextRequest, NextResponse } from 'next/server'
import { deleteProduct } from '@/lib/google-sheets'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { rowId } = body

    if (!rowId) {
      return NextResponse.json(
        { success: false, error: 'Row ID is required' },
        { status: 400 }
      )
    }

    await deleteProduct(rowId)

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    })
  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete product',
      },
      { status: 500 }
    )
  }
}
