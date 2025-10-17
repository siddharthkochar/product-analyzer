/**
 * Validation rules and error codes for multi-image product analysis
 */

export const VALIDATION_RULES = {
  minImages: 1,
  maxImages: 5,
  maxFileSize: 5 * 1024 * 1024, // 5MB per image
  maxTotalSize: 25 * 1024 * 1024, // 25MB total
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  timeout: 60000, // 60 seconds
} as const

export enum AnalyzeErrorCode {
  NO_IMAGES = 'NO_IMAGES',
  TOO_MANY_IMAGES = 'TOO_MANY_IMAGES',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  TOTAL_SIZE_EXCEEDED = 'TOTAL_SIZE_EXCEEDED',
  ALL_IMAGES_FAILED = 'ALL_IMAGES_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface ValidationResult {
  valid: boolean
  error?: string
  code?: AnalyzeErrorCode
}

/**
 * Validates image file type
 */
export function validateImageType(file: File): ValidationResult {
  const fileType = file.type.toLowerCase()

  if (!VALIDATION_RULES.allowedTypes.includes(fileType as any)) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Allowed types: ${VALIDATION_RULES.allowedTypes.join(', ')}`,
      code: AnalyzeErrorCode.INVALID_FILE_TYPE,
    }
  }

  return { valid: true }
}

/**
 * Validates image file size
 */
export function validateImageSize(file: File): ValidationResult {
  if (file.size > VALIDATION_RULES.maxFileSize) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
    const maxSizeMB = (VALIDATION_RULES.maxFileSize / (1024 * 1024)).toFixed(0)

    return {
      valid: false,
      error: `File "${file.name}" is too large (${sizeMB}MB). Maximum size: ${maxSizeMB}MB`,
      code: AnalyzeErrorCode.FILE_TOO_LARGE,
    }
  }

  return { valid: true }
}

/**
 * Validates total size of all images
 */
export function validateTotalSize(files: File[]): ValidationResult {
  const totalSize = files.reduce((sum, file) => sum + file.size, 0)

  if (totalSize > VALIDATION_RULES.maxTotalSize) {
    const totalMB = (totalSize / (1024 * 1024)).toFixed(2)
    const maxTotalMB = (VALIDATION_RULES.maxTotalSize / (1024 * 1024)).toFixed(0)

    return {
      valid: false,
      error: `Total size of all images (${totalMB}MB) exceeds maximum (${maxTotalMB}MB)`,
      code: AnalyzeErrorCode.TOTAL_SIZE_EXCEEDED,
    }
  }

  return { valid: true }
}

/**
 * Validates number of images
 */
export function validateImageCount(count: number): ValidationResult {
  if (count < VALIDATION_RULES.minImages) {
    return {
      valid: false,
      error: `At least ${VALIDATION_RULES.minImages} image is required`,
      code: AnalyzeErrorCode.NO_IMAGES,
    }
  }

  if (count > VALIDATION_RULES.maxImages) {
    return {
      valid: false,
      error: `Maximum ${VALIDATION_RULES.maxImages} images allowed. You provided ${count} images`,
      code: AnalyzeErrorCode.TOO_MANY_IMAGES,
    }
  }

  return { valid: true }
}

/**
 * Validates all images in a batch
 */
export function validateImages(files: File[]): ValidationResult {
  // Validate count
  const countResult = validateImageCount(files.length)
  if (!countResult.valid) {
    return countResult
  }

  // Validate each file type and size
  for (const file of files) {
    const typeResult = validateImageType(file)
    if (!typeResult.valid) {
      return typeResult
    }

    const sizeResult = validateImageSize(file)
    if (!sizeResult.valid) {
      return sizeResult
    }
  }

  // Validate total size
  const totalSizeResult = validateTotalSize(files)
  if (!totalSizeResult.valid) {
    return totalSizeResult
  }

  return { valid: true }
}
