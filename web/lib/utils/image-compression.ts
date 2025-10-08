/**
 * Image compression utility for optimizing uploads
 * Compresses images to target size while maintaining quality
 */

const MAX_SIZE_MB = 2
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024
const QUALITY_STEP = 0.05
const MIN_QUALITY = 0.5

export interface CompressionResult {
  base64: string
  size: number
  compressed: boolean
}

/**
 * Compresses an image file to meet target size
 * @param file - The image file to compress
 * @param targetSizeMB - Target size in megabytes (default: 2MB)
 * @returns Promise with base64 string and metadata
 */
export async function compressImage(
  file: File,
  targetSizeMB: number = MAX_SIZE_MB
): Promise<CompressionResult> {
  const targetBytes = targetSizeMB * 1024 * 1024

  // Read file as data URL
  const originalBase64 = await fileToBase64(file)
  const originalSize = getBase64Size(originalBase64)

  // If already under target size, return original
  if (originalSize <= targetBytes) {
    return {
      base64: originalBase64,
      size: originalSize,
      compressed: false,
    }
  }

  // Load image
  const img = await loadImage(originalBase64)

  // Try compression with decreasing quality
  let quality = 0.9
  let compressedBase64 = originalBase64
  let compressedSize = originalSize

  while (quality >= MIN_QUALITY && compressedSize > targetBytes) {
    compressedBase64 = await compressImageWithQuality(img, quality)
    compressedSize = getBase64Size(compressedBase64)

    if (compressedSize <= targetBytes) {
      break
    }

    quality -= QUALITY_STEP
  }

  // If still too large, try scaling down
  if (compressedSize > targetBytes) {
    let scale = 0.9
    while (scale >= 0.5 && compressedSize > targetBytes) {
      compressedBase64 = await compressImageWithScale(img, scale, MIN_QUALITY)
      compressedSize = getBase64Size(compressedBase64)

      if (compressedSize <= targetBytes) {
        break
      }

      scale -= 0.1
    }
  }

  return {
    base64: compressedBase64,
    size: compressedSize,
    compressed: true,
  }
}

/**
 * Converts File to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Loads an image from base64 string
 */
function loadImage(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = base64
  })
}

/**
 * Compresses image with specified quality
 */
function compressImageWithQuality(
  img: HTMLImageElement,
  quality: number
): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Could not get canvas context')
  }

  ctx.drawImage(img, 0, 0)

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(img.src)
          return
        }
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      },
      'image/jpeg',
      quality
    )
  })
}

/**
 * Compresses image by scaling and quality
 */
function compressImageWithScale(
  img: HTMLImageElement,
  scale: number,
  quality: number
): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = img.width * scale
  canvas.height = img.height * scale

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Could not get canvas context')
  }

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(img.src)
          return
        }
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      },
      'image/jpeg',
      quality
    )
  })
}

/**
 * Gets the size of a base64 string in bytes
 */
function getBase64Size(base64: string): number {
  // Remove data URL prefix
  const base64Data = base64.split(',')[1] || base64

  // Calculate size: base64 is ~4/3 the size of original
  // Account for padding
  const padding = (base64Data.match(/=/g) || []).length
  return (base64Data.length * 3) / 4 - padding
}

/**
 * Formats bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Validates image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
  const maxSizeMB = 5
  const maxSizeBytes = maxSizeMB * 1024 * 1024

  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload PNG, JPG, JPEG, or WEBP images.',
    }
  }

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File is too large. Maximum size is ${maxSizeMB}MB.`,
    }
  }

  return { valid: true }
}
