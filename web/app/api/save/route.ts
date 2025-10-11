import { NextRequest, NextResponse } from 'next/server'
import { saveProductToDatabase } from '@/lib/n8n'

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7)
  const startTime = Date.now()

  console.log(`[SAVE API] ===== Request ${requestId} started at ${new Date().toISOString()} =====`)

  try {
    // Parse request body
    let productData
    try {
      productData = await request.json()
    } catch (parseError) {
      console.error('[SAVE API] Failed to parse request body:', parseError)
      return NextResponse.json(
        { success: false, error: 'Invalid request body. Expected JSON.' },
        { status: 400 }
      )
    }

    console.log('[SAVE API] Received product data:', JSON.stringify(productData, null, 2))
    console.log('[SAVE API] Has nutrition field:', productData.nutrition ? 'YES' : 'NO')

    if (productData.nutrition) {
      console.log('[SAVE API] Nutrition data:', JSON.stringify(productData.nutrition, null, 2))
    }

    // Validate required fields
    if (!productData.productName || productData.productName.trim() === '') {
      console.error('[SAVE API] Validation failed: Missing or empty productName')
      return NextResponse.json(
        { success: false, error: 'Product name is required and cannot be empty' },
        { status: 400 }
      )
    }

    if (!productData.expiryDate || productData.expiryDate.trim() === '') {
      console.error('[SAVE API] Validation failed: Missing or empty expiryDate')
      return NextResponse.json(
        { success: false, error: 'Expiry date is required and cannot be empty' },
        { status: 400 }
      )
    }

    console.log('[SAVE API] Validation passed, calling n8n save webhook...')

    // Call n8n save webhook
    const result = await saveProductToDatabase(productData)

    console.log('[SAVE API] n8n save result:', result.success ? 'SUCCESS' : 'FAILED')

    if (!result.success) {
      console.error('[SAVE API] n8n save error:', result.error)

      // Determine appropriate HTTP status code based on error
      let statusCode = 500
      const errorMessage = result.error || 'Failed to save product'

      if (errorMessage.includes('timed out')) {
        statusCode = 504 // Gateway Timeout
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        statusCode = 503 // Service Unavailable
      } else if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
        statusCode = 400 // Bad Request
      } else if (errorMessage.includes('409') || errorMessage.includes('Conflict')) {
        statusCode = 409 // Conflict
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString()
        },
        { status: statusCode }
      )
    }

    const duration = Date.now() - startTime
    console.log(`[SAVE API] ===== Request ${requestId} succeeded in ${duration}ms =====`)

    return NextResponse.json({
      success: true,
      message: 'Product saved successfully',
      data: result.data,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[SAVE API] ===== Request ${requestId} FAILED after ${duration}ms =====`)
    console.error('[SAVE API] Unexpected error:', error)
    console.error('[SAVE API] Error stack:', error instanceof Error ? error.stack : 'N/A')

    // Provide detailed error message to frontend
    let errorMessage = 'An unexpected error occurred while saving the product'

    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        errorMessage = 'Could not connect to save service. Please check your internet connection.'
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Save operation timed out. The service may be slow or unavailable.'
      } else if (error.message.includes('environment variable')) {
        errorMessage = 'Server configuration error. Please contact support.'
      } else {
        errorMessage = error.message
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
