import { NextRequest, NextResponse } from 'next/server'
import { analyzeProductImage } from '@/lib/n8n'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imageBase64 } = body

    if (!imageBase64) {
      return NextResponse.json(
        { success: false, error: 'Image data is required' },
        { status: 400 }
      )
    }

    const result = await analyzeProductImage(imageBase64)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Analysis failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('POST /api/analyze error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to analyze image' },
      { status: 500 }
    )
  }
}
