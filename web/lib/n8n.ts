const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL!
const N8N_SAVE_WEBHOOK_URL = process.env.N8N_SAVE_WEBHOOK_URL!

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

export async function saveProductToDatabase(productData: any): Promise<N8nSaveResponse> {
  try {
    console.log('[N8N] Calling save webhook:', N8N_SAVE_WEBHOOK_URL)
    console.log('[N8N] Product data:', productData)

    // Call n8n save webhook with product data
    const response = await fetch(N8N_SAVE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    })

    console.log('[N8N] Save response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[N8N] Save error response:', errorText)
      throw new Error(`n8n save webhook failed with status ${response.status}: ${response.statusText}`)
    }

    const responseText = await response.text()
    console.log('[N8N] Save response text:', responseText.substring(0, 200))

    if (!responseText || responseText.trim() === '') {
      console.error('[N8N] Empty response from save webhook')
      throw new Error('n8n save webhook returned empty response.')
    }

    const data = JSON.parse(responseText)
    console.log('[N8N] Parsed save response:', data)

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('[N8N] Error calling n8n save webhook:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
