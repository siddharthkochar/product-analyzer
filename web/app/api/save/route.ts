import { NextRequest, NextResponse } from 'next/server'
import { saveProductToDatabase } from '@/lib/n8n'

export async function POST(request: NextRequest) {
  try {
    const productData = await request.json()

    console.log('[SAVE API] Received product data for saving')
    console.log('[SAVE API] Has nutrition field:', productData.nutrition ? 'YES' : 'NO')
    if (productData.nutrition) {
      console.log('[SAVE API] Nutrition data:', JSON.stringify(productData.nutrition))
    }

    // Validate required fields
    if (!productData.productName) {
      console.error('[SAVE API] Missing productName')
      return NextResponse.json(
        { success: false, error: 'Product name is required' },
        { status: 400 }
      )
    }

    if (!productData.expiryDate) {
      console.error('[SAVE API] Missing expiryDate')
      return NextResponse.json(
        { success: false, error: 'Expiry date is required' },
        { status: 400 }
      )
    }

    console.log('[SAVE API] Calling n8n save webhook...')

    // Call n8n save webhook
    const result = await saveProductToDatabase(productData)

    console.log('[SAVE API] n8n save result:', result.success ? 'SUCCESS' : 'FAILED')
    if (!result.success) {
      console.error('[SAVE API] n8n save error:', result.error)
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to save product' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Product saved successfully',
      data: result.data,
    })
  } catch (error) {
    console.error('[SAVE API] Unexpected error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save product',
      },
      { status: 500 }
    )
  }
}
