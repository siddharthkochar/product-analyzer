import { NextRequest, NextResponse } from 'next/server'
import { analyzeMultipleProductImages } from '@/lib/n8n'
import {
  validateImages,
  VALIDATION_RULES,
  AnalyzeErrorCode,
} from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    // Extract all image files from FormData
    const imageFiles: File[] = []
    let imageIndex = 0

    // Loop through image0, image1, image2, etc.
    while (true) {
      const imageFile = formData.get(`image${imageIndex}`) as File | null

      if (!imageFile) {
        break // No more images
      }

      imageFiles.push(imageFile)
      imageIndex++
    }

    console.log('[ANALYZE MULTIPLE API] Received', imageFiles.length, 'images')

    // Validate images
    const validation = validateImages(imageFiles)
    if (!validation.valid) {
      console.error('[ANALYZE MULTIPLE API] Validation failed:', validation.error)
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
          code: validation.code,
        },
        { status: 400 }
      )
    }

    // Log each image
    imageFiles.forEach((file, index) => {
      console.log(
        `[ANALYZE MULTIPLE API] Image ${index}: ${file.name} (${file.type}, ${file.size} bytes)`
      )
    })

    console.log('[ANALYZE MULTIPLE API] All images validated successfully')
    console.log('[ANALYZE MULTIPLE API] Calling n8n multi-image webhook...')

    // Call n8n webhook
    const result = await analyzeMultipleProductImages(imageFiles)

    console.log('[ANALYZE MULTIPLE API] n8n result:', result.success ? 'SUCCESS' : 'FAILED')

    if (!result.success) {
      console.error('[ANALYZE MULTIPLE API] n8n error:', result.error)

      // Determine error code based on error message
      let errorCode = AnalyzeErrorCode.UNKNOWN_ERROR
      if (result.error?.toLowerCase().includes('timeout')) {
        errorCode = AnalyzeErrorCode.TIMEOUT
      } else if (result.error?.toLowerCase().includes('network')) {
        errorCode = AnalyzeErrorCode.NETWORK_ERROR
      } else if (result.error?.toLowerCase().includes('all images failed')) {
        errorCode = AnalyzeErrorCode.ALL_IMAGES_FAILED
      }

      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Multi-image analysis failed',
          code: errorCode,
        },
        { status: 500 }
      )
    }

    console.log('[ANALYZE MULTIPLE API] Response metadata:', result.metadata)
    console.log('[ANALYZE MULTIPLE API] Response data keys:', Object.keys(result.data || {}))

    // Return success response with metadata
    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: result.metadata,
    })
  } catch (error) {
    console.error('[ANALYZE MULTIPLE API] Unexpected error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze images',
        code: AnalyzeErrorCode.UNKNOWN_ERROR,
      },
      { status: 500 }
    )
  }
}
