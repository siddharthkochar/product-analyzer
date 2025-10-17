export interface Product {
  id: string
  productName: string
  brand: string
  category: string
  subCategory: string
  expiryDate: string
  daysToExpire: number
  mrp: string
  weight: string
  ingredients: string
  nutritionalInfo: string
  healthScore: number
  healthRating: string
  concerns: string
  quantity: number
  dateAdded: string
}

export interface ProductFormData {
  productName: string
  brand: string
  category: string
  subCategory: string
  expiryDate: string
  mrp: string
  weight: string
  ingredients: string
  nutritionalInfo: string
  quantity: number
}

export interface NutritionData {
  energyKcal?: number | null
  proteinG?: number | null
  carbsG?: number | null
  sugarG?: number | null
  fatG?: number | null
  saturatedFatG?: number | null
  transFatG?: number | null
  sodiumMg?: number | null
  fiberG?: number | null
}

export interface ProductData {
  productName: string
  brand: string
  category: string
  subCategory: string
  expiryDate: string
  mrp: string
  weight: string
  ingredients: string
  nutrition: NutritionData
  daysToExpire?: string
  expiryStatus?: string
  healthRating?: string
  healthScore?: number
  concerns?: string[]
}

export interface ProcessingMetadata {
  imagesProcessed: number
  totalImages: number
  failedImages: number
  failedImageNames?: string[]
  confidence: number
  processingTimeMs: number
}

export interface MultiImageAnalyzeResponse {
  success: boolean
  data?: ProductData
  metadata?: ProcessingMetadata
  error?: string
  code?: string
}
