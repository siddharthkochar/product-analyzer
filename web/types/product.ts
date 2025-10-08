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
