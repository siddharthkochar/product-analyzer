// Environment variable validation
function validateEnvVar(name: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    const errorMsg = `[N8N] CRITICAL: Environment variable ${name} is not defined. Please check your .env.local file.`
    console.error(errorMsg)
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

// Skip validation during build phase - environment variables are only needed at runtime
// This prevents build failures when env vars are only available in production environment
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || process.env.NODE_ENV === 'production' && !process.env.N8N_WEBHOOK_URL

let N8N_WEBHOOK_URL: string
let N8N_SAVE_WEBHOOK_URL: string
let N8N_MULTI_WEBHOOK_URL: string

if (isBuildTime) {
  // Use placeholder values during build - they will be replaced at runtime
  console.log('[N8N] Build time detected - skipping environment validation')
  N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'BUILD_TIME_PLACEHOLDER'
  N8N_SAVE_WEBHOOK_URL = process.env.N8N_SAVE_WEBHOOK_URL || 'BUILD_TIME_PLACEHOLDER'
  N8N_MULTI_WEBHOOK_URL = process.env.N8N_MULTI_WEBHOOK_URL || 'BUILD_TIME_PLACEHOLDER'
} else {
  // Runtime validation - ensure env vars are available
  N8N_WEBHOOK_URL = validateEnvVar('N8N_WEBHOOK_URL', process.env.N8N_WEBHOOK_URL)
  N8N_SAVE_WEBHOOK_URL = validateEnvVar('N8N_SAVE_WEBHOOK_URL', process.env.N8N_SAVE_WEBHOOK_URL)
  N8N_MULTI_WEBHOOK_URL = validateEnvVar('N8N_MULTI_WEBHOOK_URL', process.env.N8N_MULTI_WEBHOOK_URL)

  console.log('[N8N] Configuration loaded successfully')
  console.log('[N8N] Analyze webhook:', N8N_WEBHOOK_URL.substring(0, 30) + '...')
  console.log('[N8N] Save webhook:', N8N_SAVE_WEBHOOK_URL.substring(0, 30) + '...')
  console.log('[N8N] Multi-image webhook:', N8N_MULTI_WEBHOOK_URL.substring(0, 30) + '...')
}

export interface N8nAnalyzeResponse {
  success: boolean
  data?: any
  error?: string
}

export interface N8nSaveResponse {
  success: boolean
  data?: any
  error?: string
}

export async function analyzeProductImage(imageFile: File | Blob): Promise<N8nAnalyzeResponse> {
  try {
    console.log('[N8N] Calling webhook:', N8N_WEBHOOK_URL)
    console.log('[N8N] Image file type:', imageFile.type)
    console.log('[N8N] Image file size:', imageFile.size, 'bytes')

    // Create FormData and append the image file
    const formData = new FormData()
    formData.append('image', imageFile, 'product.jpg')

    // n8n webhook expects multipart/form-data with file attachment
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      // Don't set Content-Type header - browser will set it with correct boundary
      body: formData,
    })

    console.log('[N8N] Response status:', response.status)
    console.log('[N8N] Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[N8N] Error response:', errorText)
      throw new Error(`n8n webhook failed with status ${response.status}: ${response.statusText}`)
    }

    // Get response as text first to handle empty responses
    const responseText = await response.text()
    console.log('[N8N] Response text:', responseText.substring(0, 200))

    if (!responseText || responseText.trim() === '') {
      console.error('[N8N] Empty response from webhook')
      throw new Error('n8n webhook returned empty response. The workflow may not be configured to return data.')
    }

    const data = JSON.parse(responseText)
    console.log('[N8N] Parsed response:', data)

    // If n8n already returns {success: true, data: {...}}, return it directly
    // Otherwise wrap it in our response format
    if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
      console.log('[N8N] Response already has success/data wrapper, returning as-is')
      return data
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('[N8N] Error calling n8n webhook:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Helper function to implement retry logic with exponential backoff
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 1000,
  shouldRetry: (error: Error) => boolean = () => true
): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = initialDelayMs * Math.pow(2, attempt - 1)
        console.log(`[N8N] Retry attempt ${attempt}/${maxRetries} after ${delay}ms delay...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }

      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Check if we should retry
      const isLastAttempt = attempt === maxRetries
      const canRetry = shouldRetry(lastError)

      if (isLastAttempt || !canRetry) {
        console.error(`[N8N] All retry attempts exhausted or error not retryable`)
        throw lastError
      }

      console.warn(`[N8N] Attempt ${attempt + 1} failed:`, lastError.message)
    }
  }

  throw lastError!
}

export async function saveProductToDatabase(productData: any): Promise<N8nSaveResponse> {
  const startTime = Date.now()
  const requestId = Math.random().toString(36).substring(7)

  console.log(`[N8N SAVE] ===== Request ${requestId} started at ${new Date().toISOString()} =====`)
  console.log(`[N8N SAVE] Target webhook: ${N8N_SAVE_WEBHOOK_URL}`)
  console.log(`[N8N SAVE] Product data payload:`, JSON.stringify(productData, null, 2))
  console.log(`[N8N SAVE] Has nutrition field:`, productData.nutrition ? 'YES' : 'NO')

  if (productData.nutrition) {
    console.log(`[N8N SAVE] Nutrition data:`, JSON.stringify(productData.nutrition, null, 2))
  }

  try {
    const result = await retryWithBackoff(
      async () => {
        console.log(`[N8N SAVE] Sending POST request to webhook...`)

        // Create abort controller for timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

        try {
          const response = await fetch(N8N_SAVE_WEBHOOK_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(productData),
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          console.log(`[N8N SAVE] Response received - Status: ${response.status} ${response.statusText}`)
          console.log(`[N8N SAVE] Response headers:`, JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2))

          if (!response.ok) {
            const errorText = await response.text()
            console.error(`[N8N SAVE] Error response body:`, errorText)

            // Create detailed error based on status code
            const error = new Error(
              `n8n save webhook failed with status ${response.status}: ${response.statusText}. Response: ${errorText}`
            )

            // Add status code to error for retry logic
            ;(error as any).statusCode = response.status
            throw error
          }

          const responseText = await response.text()
          console.log(`[N8N SAVE] Response body (first 500 chars):`, responseText.substring(0, 500))

          if (!responseText || responseText.trim() === '') {
            console.error(`[N8N SAVE] Empty response from save webhook`)
            throw new Error('n8n save webhook returned empty response. The workflow may not be configured correctly.')
          }

          const data = JSON.parse(responseText)
          console.log(`[N8N SAVE] Parsed response data:`, JSON.stringify(data, null, 2))

          return data
        } catch (fetchError) {
          clearTimeout(timeoutId)

          if (fetchError instanceof Error && fetchError.name === 'AbortError') {
            console.error(`[N8N SAVE] Request timed out after 30 seconds`)
            const timeoutError = new Error('Request timed out after 30 seconds. The webhook may be slow or unresponsive.')
            ;(timeoutError as any).statusCode = 408 // Request Timeout
            throw timeoutError
          }

          throw fetchError
        }
      },
      3, // maxRetries
      1000, // initialDelayMs
      (error: Error) => {
        // Only retry on network errors or 5xx server errors, not 4xx client errors
        const statusCode = (error as any).statusCode

        if (!statusCode) {
          // Network error or timeout - retry
          console.log(`[N8N SAVE] Network error or timeout - will retry:`, error.message)
          return true
        }

        if (statusCode >= 500 && statusCode < 600) {
          // 5xx server error - retry
          console.log(`[N8N SAVE] Server error (${statusCode}) - will retry`)
          return true
        }

        // 4xx client error - don't retry
        console.log(`[N8N SAVE] Client error (${statusCode}) - will NOT retry`)
        return false
      }
    )

    const duration = Date.now() - startTime
    console.log(`[N8N SAVE] ===== Request ${requestId} succeeded in ${duration}ms =====`)

    return {
      success: true,
      data: result,
    }
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[N8N SAVE] ===== Request ${requestId} FAILED after ${duration}ms =====`)
    console.error(`[N8N SAVE] Final error:`, error)
    console.error(`[N8N SAVE] Error stack:`, error instanceof Error ? error.stack : 'N/A')

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred while saving product',
    }
  }
}

export interface N8nMultiImageAnalyzeResponse {
  success: boolean
  data?: any
  metadata?: {
    imagesProcessed: number
    totalImages: number
    failedImages: number
    failedImageNames?: string[]
    confidence: number
    processingTimeMs: number
  }
  error?: string
}

export async function analyzeMultipleProductImages(
  imageFiles: (File | Blob)[]
): Promise<N8nMultiImageAnalyzeResponse> {
  const startTime = Date.now()

  try {
    console.log('[N8N MULTI] Calling multi-image webhook:', N8N_MULTI_WEBHOOK_URL)
    console.log('[N8N MULTI] Number of images:', imageFiles.length)

    // Create FormData and append all images
    const formData = new FormData()
    imageFiles.forEach((file, index) => {
      const fileName = file instanceof File ? file.name : `image_${index}.jpg`
      formData.append(`image${index}`, file, fileName)
      console.log(`[N8N MULTI] Added image${index}: ${fileName} (${file.size} bytes, ${file.type})`)
    })

    // Create abort controller for timeout (60 seconds for multi-image processing)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000)

    try {
      const response = await fetch(N8N_MULTI_WEBHOOK_URL, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      console.log('[N8N MULTI] Response status:', response.status)
      console.log('[N8N MULTI] Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[N8N MULTI] Error response:', errorText)
        throw new Error(
          `n8n multi-image webhook failed with status ${response.status}: ${response.statusText}`
        )
      }

      const responseText = await response.text()
      console.log('[N8N MULTI] Response text (first 500 chars):', responseText.substring(0, 500))

      if (!responseText || responseText.trim() === '') {
        console.error('[N8N MULTI] Empty response from webhook')
        throw new Error(
          'n8n multi-image webhook returned empty response. The workflow may not be configured to return data.'
        )
      }

      const data = JSON.parse(responseText)
      console.log('[N8N MULTI] Parsed response:', JSON.stringify(data, null, 2))

      const processingTimeMs = Date.now() - startTime
      console.log(`[N8N MULTI] Processing completed in ${processingTimeMs}ms`)

      // If response already has success/data/metadata structure, return it
      if (data && typeof data === 'object' && 'success' in data) {
        return {
          ...data,
          metadata: {
            ...data.metadata,
            processingTimeMs,
          },
        }
      }

      // Otherwise wrap it
      return {
        success: true,
        data,
        metadata: {
          imagesProcessed: imageFiles.length,
          totalImages: imageFiles.length,
          failedImages: 0,
          confidence: 100,
          processingTimeMs,
        },
      }
    } catch (fetchError) {
      clearTimeout(timeoutId)

      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('[N8N MULTI] Request timed out after 60 seconds')
        return {
          success: false,
          error: 'Multi-image analysis timed out after 60 seconds. Please try with fewer images.',
        }
      }

      throw fetchError
    }
  } catch (error) {
    const processingTimeMs = Date.now() - startTime
    console.error('[N8N MULTI] Error calling n8n multi-image webhook:', error)
    console.error('[N8N MULTI] Processing failed after', processingTimeMs, 'ms')

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during multi-image analysis',
    }
  }
}
