const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL!

export interface N8nAnalyzeRequest {
  imageBase64: string
}

export interface N8nAnalyzeResponse {
  success: boolean
  data?: any
  error?: string
}

export async function analyzeProductImage(imageBase64: string): Promise<N8nAnalyzeResponse> {
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageBase64 }),
    })

    if (!response.ok) {
      throw new Error(`n8n webhook failed: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Error calling n8n webhook:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
