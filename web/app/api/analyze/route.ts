import { NextRequest, NextResponse } from 'next/server'
import { analyzeProductImage } from '@/lib/n8n'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File | null

    if (!imageFile) {
      console.error('[ANALYZE API] Missing image file in request')
      return NextResponse.json(
        { success: false, error: 'Image file is required' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!imageFile.type.startsWith('image/')) {
      console.error('[ANALYZE API] Invalid file type:', imageFile.type)
      return NextResponse.json(
        { success: false, error: 'File must be an image (JPEG, PNG, WebP, etc.)' },
        { status: 400 }
      )
    }

    console.log('[ANALYZE API] Received image file:', imageFile.name)
    console.log('[ANALYZE API] File type:', imageFile.type)
    console.log('[ANALYZE API] File size:', imageFile.size, 'bytes')
    console.log('[ANALYZE API] Calling n8n webhook...')

    const result = await analyzeProductImage(imageFile)

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
