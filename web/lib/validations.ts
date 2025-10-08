import { z } from 'zod'

// Product form validation schema
export const productFormSchema = z.object({
  productName: z.string().min(1, 'Product name is required').max(200),
  brand: z.string().min(1, 'Brand is required').max(100),
  category: z.string().min(1, 'Category is required'),
  subCategory: z.string().min(1, 'Sub-category is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  mrp: z.string().min(1, 'MRP is required'),
  weight: z.string().min(1, 'Weight/Quantity is required'),
  ingredients: z.string().optional(),
  nutritionalInfo: z.string().optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
})

export type ProductFormValues = z.infer<typeof productFormSchema>

// Image upload validation
export const imageUploadSchema = z.object({
  imageBase64: z.string().min(1, 'Image is required'),
})

export type ImageUploadValues = z.infer<typeof imageUploadSchema>

// Filter schema
export const filterSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  healthRating: z.string().optional(),
  expiryStatus: z.string().optional(),
})

export type FilterValues = z.infer<typeof filterSchema>
