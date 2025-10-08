import { google } from 'googleapis'
import type { Product } from '@/types/product'

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID!
const SHEET_NAME = 'Products'

// Create OAuth2 client
function getAuth() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  )

  auth.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  })

  return auth
}

// Get sheets API instance
function getSheetsAPI() {
  const auth = getAuth()
  return google.sheets({ version: 'v4', auth })
}

// Get the sheetId for the Products sheet
async function getSheetId(): Promise<number> {
  try {
    const sheets = getSheetsAPI()
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    })

    const sheet = response.data.sheets?.find(
      (s) => s.properties?.title === SHEET_NAME
    )

    if (!sheet || sheet.properties?.sheetId === undefined) {
      console.error('[SHEET_ID] Could not find sheet with name:', SHEET_NAME)
      console.error('[SHEET_ID] Available sheets:', response.data.sheets?.map(s => s.properties?.title))
      throw new Error(`Sheet "${SHEET_NAME}" not found`)
    }

    console.log('[SHEET_ID] Found sheetId:', sheet.properties.sheetId, 'for sheet:', SHEET_NAME)
    return sheet.properties.sheetId as number
  } catch (error) {
    console.error('[SHEET_ID] Error getting sheetId:', error)
    throw error
  }
}

// Read all products from Google Sheets
export async function getAllProducts(): Promise<Product[]> {
  try {
    const sheets = getSheetsAPI()
    const range = `${SHEET_NAME}!A2:Q` // Read from row 2 onwards (skip header)

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range,
    })

    const rows = response.data.values || []

    return rows.map((row, index) => {
      // Calculate days to expire from expiry date
      const expiryDate = row[4] || ''
      let daysToExpire = 0
      if (expiryDate) {
        const expiry = new Date(expiryDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0) // Reset time to start of day
        expiry.setHours(0, 0, 0, 0) // Reset time to start of day
        daysToExpire = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      }

      return {
        id: String(index + 2), // Row number as ID (starting from 2)
        productName: row[0] || '', // A: Product Name
        brand: row[1] || 'Unknown', // B: Brand
        category: row[2] || 'Uncategorized', // C: Category
        subCategory: row[3] || 'Other', // D: Sub-category
        expiryDate: expiryDate, // E: Expiry Date
        daysToExpire: daysToExpire, // F: Days to Expire (calculated, not from sheet)
        mrp: row[6] || '', // G: MRP
        weight: row[7] || '', // H: Weight
        quantity: parseInt(row[8]) || 1, // I: Quantity (Phase 1B addition)
        ingredients: row[9] || '', // J: Ingredients
        nutritionalInfo: '', // Not in sheets currently
        dateAdded: row[10] || new Date().toISOString(), // K: Date Added
        healthRating: row[11] || '', // L: Health Ratings
        healthScore: parseInt(row[12]) || 0, // M: Health Score
        concerns: row[13] || '', // N: Concerns
      }
    })
  } catch (error) {
    console.error('Error reading from Google Sheets:', error)
    throw new Error('Failed to fetch products from Google Sheets')
  }
}

// Update a product row
export async function updateProduct(rowId: string, data: Partial<Product>): Promise<void> {
  try {
    const sheets = getSheetsAPI()
    const range = `${SHEET_NAME}!A${rowId}:Q${rowId}`

    // Get current row first
    const currentData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range,
    })

    const currentRow = currentData.data.values?.[0] || []

    // Calculate daysToExpire if expiryDate is being updated
    let daysToExpire = data.daysToExpire
    if (data.expiryDate) {
      const expiry = new Date(data.expiryDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      expiry.setHours(0, 0, 0, 0)
      daysToExpire = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    }

    // Merge updates with current data - CORRECTED column mapping
    const updatedRow = [
      data.productName ?? currentRow[0] ?? '', // A: Product Name
      data.brand ?? currentRow[1] ?? 'Unknown', // B: Brand
      data.category ?? currentRow[2] ?? 'Uncategorized', // C: Category
      data.subCategory ?? currentRow[3] ?? 'Other', // D: Sub-category
      data.expiryDate ?? currentRow[4] ?? '', // E: Expiry Date
      daysToExpire ?? currentRow[5] ?? 0, // F: Days to Expire
      data.mrp ?? currentRow[6] ?? '', // G: MRP
      data.weight ?? currentRow[7] ?? '', // H: Weight
      data.quantity ?? currentRow[8] ?? 1, // I: Quantity
      data.ingredients ?? currentRow[9] ?? '', // J: Ingredients
      currentRow[10] ?? new Date().toISOString(), // K: Date Added (don't update)
      data.healthRating ?? currentRow[11] ?? '', // L: Health Ratings
      data.healthScore ?? currentRow[12] ?? 0, // M: Health Score
      data.concerns ?? currentRow[13] ?? '', // N: Concerns
    ]

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: 'RAW',
      requestBody: {
        values: [updatedRow],
      },
    })
  } catch (error) {
    console.error('Error updating Google Sheets:', error)
    throw new Error('Failed to update product in Google Sheets')
  }
}

// Delete a product row
export async function deleteProduct(rowId: string): Promise<void> {
  try {
    console.log('[DELETE] Starting delete for rowId:', rowId)
    const sheets = getSheetsAPI()

    // Get the correct sheetId dynamically
    const sheetId = await getSheetId()
    console.log('[DELETE] Using sheetId:', sheetId)

    const rowIndex = parseInt(rowId) - 1 // Convert to 0-based index

    console.log('[DELETE] Calculated rowIndex (0-based):', rowIndex)
    console.log('[DELETE] Will delete row range:', rowIndex, 'to', rowIndex + 1)

    const response = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex,
                endIndex: rowIndex + 1,
              },
            },
          },
        ],
      },
    })

    console.log('[DELETE] Google Sheets API response:', JSON.stringify(response.data, null, 2))
    console.log('[DELETE] Delete operation completed successfully')
  } catch (error) {
    console.error('[DELETE] Error deleting from Google Sheets:', error)
    if (error instanceof Error) {
      console.error('[DELETE] Error message:', error.message)
      console.error('[DELETE] Error stack:', error.stack)
    }
    throw new Error('Failed to delete product from Google Sheets')
  }
}

// Check for duplicate products
export async function checkDuplicate(productName: string, brand: string): Promise<Product | null> {
  try {
    const products = await getAllProducts()
    const duplicate = products.find(
      (p) =>
        p.productName.toLowerCase() === productName.toLowerCase() &&
        p.brand.toLowerCase() === brand.toLowerCase()
    )
    return duplicate || null
  } catch (error) {
    console.error('Error checking duplicates:', error)
    throw new Error('Failed to check for duplicates')
  }
}
