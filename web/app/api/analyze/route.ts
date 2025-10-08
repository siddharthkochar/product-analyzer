import { NextRequest, NextResponse } from 'next/server'
import { analyzeProductImage } from '@/lib/n8n'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imageBase64 } = body

    if (!imageBase64) {
      console.error('[ANALYZE API] Missing imageBase64 in request body')
      return NextResponse.json(
        { success: false, error: 'Image data is required' },
        { status: 400 }
      )
    }

    console.log('[ANALYZE API] Received image, size:', imageBase64.length, 'characters')
    console.log('[ANALYZE API] Calling n8n webhook...')

    const result = await analyzeProductImage(imageBase64)

    console.log('[ANALYZE API] n8n result:', result.success ? 'SUCCESS' : 'FAILED')
    if (!result.success) {
      console.error('[ANALYZE API] n8n error:', result.error)
    } else {
      console.log('[ANALYZE API] Response data keys:', Object.keys(result.data || {}))
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Analysis failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('[ANALYZE API] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to analyze image' },
      { status: 500 }
    )
  }
}
