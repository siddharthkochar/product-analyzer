import { NextRequest, NextResponse } from 'next/server'
import { checkDuplicate } from '@/lib/google-sheets'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productName, brand } = body

    if (!productName || !brand) {
      return NextResponse.json(
        { success: false, error: 'Product name and brand are required' },
        { status: 400 }
      )
    }

    const duplicate = await checkDuplicate(productName, brand)

    return NextResponse.json({
      success: true,
      isDuplicate: !!duplicate,
      product: duplicate,
    })
  } catch (error) {
    console.error('POST /api/products/check-duplicate error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check for duplicates' },
      { status: 500 }
    )
  }
}
