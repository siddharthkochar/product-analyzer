# Product Analyzer n8n Workflows

## Overview

Three n8n workflows handle product image analysis and database operations:

1. **Single-Image Analysis**: Analyzes one image, returns results (no DB save)
2. **Multi-Image Analysis**: Processes 1-5 images, merges results intelligently (no DB save)
3. **Save Analysis**: Saves reviewed/edited product data to Supabase

**Important**: Analysis workflows do NOT save to database automatically. User reviews/edits data in web app, then saves via separate endpoint.

---

## Workflow 1: Single-Image Analysis

**Webhook**: `POST https://n8n.kochar.dev/webhook/product-analyzer`
**ID**: `q3zvwWYkI6EKFMzi`

### Flow
```
Webhook → Gemini Vision API → Parse & Transform → Calculate Expiry → Analyze Health → Response
```

### Nodes

**1. Webhook - Receive Images**
- Path: `/product-analyzer`
- Method: POST
- Input: FormData with `image` field

**2. Gemini Vision API**
- Model: `gemini-2.5-flash`
- Extracts: Product name, brand, category, subcategory, expiry, MRP, weight, ingredients, nutrition
- Output: JSON response

**3. Parse & Transform Data**
- Cleans markdown formatting (`\`\`\`json`)
- Validates required fields (productName, expiryDate)
- Normalizes nutrition object
- Error handling with fallback

**4. Calculate Days to Expire**
- Formats: "Expires today", "5 days", "2 months 1 week", "Expired X days ago"
- Status: Critical/Warning/Good/Expired

**5. Analyze Health Rating**
- Score: 0-99.9 (base 100)
- Penalties: Trans fats (-40), HFCS (-25), artificial sweeteners (-20), high sugar/sodium/fat (-15 each)
- Bonuses: High fiber (+5), high protein (+5)
- Ratings: Healthy (80-100), Moderate (60-79), Not Healthy (40-59), Harmful (0-39)

**6. Respond with Analysis Results**
- Returns: `{ "success": true, "data": {...} }`
- **Does NOT save to database**

---

## Workflow 2: Multi-Image Analysis

**Webhook**: `POST https://n8n.kochar.dev/webhook/product-analyzer-multi`
**ID**: `DMkW7xPZcZygKQ9J`

### Flow
```
Webhook → Extract Images → Loop (Gemini → Parse) → Merge → Calculate Expiry → Analyze Health → Response
```

### Nodes

**1. Webhook - Receive Multiple Images**
- Path: `/product-analyzer-multi`
- Input: FormData with `image0`, `image1`, ... `image4` (max 5)

**2. Extract Images from FormData**
- Validates: 1-5 images
- Extracts binary data and metadata (index, filename, size)

**3. Loop Over Items**
- Type: `splitInBatches`
- Processes each image sequentially

**4. Gemini Vision API** (per image)
- Same prompt as single-image workflow

**5. Parse Single Image Response**
- Parses each response individually
- Tags with `_extractionSuccess`, `_imageIndex`, `_imageName`
- Failed images don't stop workflow

**6. Merge Results** ⭐
- **Merging Strategies**:
  - Product Name/Brand: **LONGEST** (most descriptive)
  - Category/Weight: **MOST FREQUENT** (voting)
  - Expiry Date: **EARLIEST** (safety first)
  - MRP: **HIGHEST** (accurate price)
  - Ingredients: **DEDUPLICATE & MERGE**
  - Nutrition: **AVERAGE** (non-null values)

- **Confidence Calculation** (0-100%):
  - 9 fields checked (11% each)
  - Product name/brand/category/subcategory/expiry/MRP/weight match = 100% agreement
  - Ingredients: ≥70% Jaccard similarity
  - Nutrition: ≥80% of values within 20% range

- **Metadata**:
  ```json
  {
    "imagesProcessed": 3,
    "totalImages": 5,
    "failedImages": 2,
    "failedImageNames": ["image_2.jpg", "image_4.jpg"],
    "confidence": 87
  }
  ```

**7-8. Calculate Expiry & Analyze Health**
- Same logic as single-image workflow

**9. Respond with Analysis Results**
- Returns: `{ "success": true, "data": {...}, "metadata": {...} }`
- **Does NOT save to database**

---

## Workflow 3: Save Analysis

**Webhook**: `POST https://n8n.kochar.dev/webhook/save-product`
**ID**: `kRO0IHtEplqQjnNn`

### Flow
```
Webhook → Prepare for Database → Store in Supabase → Response
```

### Nodes

**1. Webhook - Save Product**
- Path: `/save-product`
- Input: Reviewed/edited product data from web app

**2. Prepare for Database**
- Transforms:
  - `nutrition` object → JSON string (TEXT)
  - `concerns` array → newline-separated string (TEXT)
  - `healthScore` capped at 99.9, rounded to 1 decimal (NUMERIC(3,1))

**3. Create a row** (Supabase)
- Table: `products`
- Inserts all fields with proper type mapping

**4. Webhook Response - Save**
- Returns: `{ "success": true, "message": "Product saved successfully", "data": {...} }`

---

## Shared Components

### Gemini Vision API Prompt

```
Analyze this product packaging image and extract the following information:

- Product Name (full name including brand)
- Brand (manufacturer name, e.g., "Britannia", "Parle")
- Category (Snacks, Beverages, Dairy, Bakery, etc.)
- Sub-category (Biscuits, Chips, Cookies, etc.)
- Expiry Date (YYYY-MM-DD format)
- MRP (with currency symbol)
- Weight/Quantity (with unit: g, kg, ml, L)
- Ingredients (comma-separated list)
- Nutritional Information (per 100g/100ml):
  Energy, Protein, Carbs, Sugar, Fat, Saturated Fat, Trans Fat, Sodium, Fiber

Return ONLY valid JSON (no markdown):
{
  "productName": "string",
  "brand": "string",
  "category": "string",
  "subCategory": "string",
  "expiryDate": "YYYY-MM-DD",
  "mrp": "string with currency",
  "weight": "string with unit",
  "ingredients": "comma-separated",
  "nutrition": {
    "energyKcal": number,
    "proteinG": number,
    "carbsG": number,
    "sugarG": number,
    "fatG": number,
    "saturatedFatG": number,
    "transFatG": number,
    "sodiumMg": number,
    "fiberG": number
  }
}
```

### Supabase Schema

**Table**: `products`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `product_name` | TEXT | Product name |
| `brand` | TEXT | Brand/manufacturer |
| `category` | TEXT | Main category |
| `sub_category` | TEXT | Sub-category |
| `expiry_date` | DATE | Expiry date |
| `mrp` | TEXT | Maximum Retail Price |
| `weight` | TEXT | Weight/quantity with unit |
| `ingredients` | TEXT | Comma-separated ingredients |
| `nutritional_info` | TEXT | JSON string of nutrition data |
| `health_score` | NUMERIC(3,1) | 0-99.9 |
| `health_rating` | TEXT | Healthy/Moderate/Not Healthy/Harmful |
| `concerns` | TEXT | Newline-separated health concerns |
| `quantity` | INTEGER | Quantity in inventory |
| `date_added` | TIMESTAMP | When added |
| `created_at` | TIMESTAMP | Record creation |
| `updated_at` | TIMESTAMP | Last update |

---

## API Endpoints

### Single-Image Analysis
**Web API**: `POST /api/analyze`
**n8n Webhook**: `POST https://n8n.kochar.dev/webhook/product-analyzer`

**Request**:
```javascript
const formData = new FormData()
formData.append('image', file)
fetch('/api/analyze', { method: 'POST', body: formData })
```

**Response**:
```json
{
  "success": true,
  "data": {
    "productName": "...",
    "brand": "...",
    "expiryDate": "2025-12-31",
    "daysToExpire": "2 months",
    "healthRating": "Moderate",
    "healthScore": 67.5,
    "concerns": [...]
  }
}
```

### Multi-Image Analysis
**Web API**: `POST /api/analyze-multiple`
**n8n Webhook**: `POST https://n8n.kochar.dev/webhook/product-analyzer-multi`

**Request**:
```javascript
const formData = new FormData()
formData.append('image0', file1)
formData.append('image1', file2)
// ... up to image4 (max 5)
fetch('/api/analyze-multiple', { method: 'POST', body: formData })
```

**Response**:
```json
{
  "success": true,
  "data": { /* same as single-image */ },
  "metadata": {
    "imagesProcessed": 3,
    "totalImages": 3,
    "failedImages": 0,
    "confidence": 95
  }
}
```

### Save Product
**Web API**: `POST /api/save`
**n8n Webhook**: `POST https://n8n.kochar.dev/webhook/save-product`

**Request**:
```javascript
fetch('/api/save', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(productData)
})
```

**Response**:
```json
{
  "success": true,
  "message": "Product saved successfully",
  "data": { /* saved product record */ }
}
```

---

## Health Rating Algorithm

**Base Score**: 100

**Penalties**:
- Trans fats: -40
- High fructose corn syrup: -25
- Artificial sweeteners: -20
- Sodium nitrite: -20
- Artificial colors: -15
- MSG: -15
- High sugar (>15g/100g): -15
- High sodium (>500mg/100g): -15
- High saturated fat (>5g/100g): -15
- Trans fat (any amount): -30
- Palm oil: -10
- Multiple preservatives: -10

**Bonuses**:
- High fiber (≥5g/100g): +5
- High protein (≥10g/100g): +5

**Final**: Clamped to 0-99.9

**Ratings**:
- 80-100: Healthy
- 60-79: Moderate
- 40-59: Not Healthy
- 0-39: Harmful
