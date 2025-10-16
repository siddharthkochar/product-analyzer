# Product Analyzer n8n Workflows

## Overview

This system uses **two n8n workflows** to analyze product packaging images and extract comprehensive product information including ingredients, nutrition, expiry dates, and health ratings.

- **Single-Image Workflow**: Analyzes one product image at a time
- **Multi-Image Workflow**: Processes 1-5 images of the same product and intelligently merges results for improved accuracy

## Architecture

### System Components
```
Web Frontend (Next.js)
    ↓
API Endpoint (/api/analyze or /api/analyze-multiple)
    ↓
n8n Webhook
    ↓
Gemini Vision API (Google AI)
    ↓
Data Processing Pipeline
    ↓
Supabase Database
    ↓
Response to Frontend
```

---

## Workflow 1: Single-Image Analysis

**Webhook**: `POST https://n8n.kochar.dev/webhook/product-analyzer`

### Node Flow
```
1. Webhook Trigger
   ↓
2. Gemini Vision API
   ↓
3. Parse & Transform Data
   ↓
4. Calculate Days to Expire
   ↓
5. Analyze Health Rating
   ↓
6. Prepare for Database
   ↓
7. Store in Supabase
   ↓
8. Check Expiry Alert
   ↓
9. Webhook Response
```

### Node Descriptions

#### 1. Webhook Trigger
- **Type**: n8n-nodes-base.webhook
- **Path**: `/product-analyzer`
- **Method**: POST
- **Input**: Binary image data (FormData field: `image`)
- **Response Mode**: responseNode

#### 2. Gemini Vision API
- **Type**: @n8n/n8n-nodes-langchain.googleGemini
- **Model**: `models/gemini-2.5-flash`
- **Operation**: Image analysis
- **Prompt**: Extracts product name, brand, category, sub-category, expiry date, MRP, weight, ingredients, and nutrition facts
- **Output Format**: JSON structure with product data

#### 3. Parse & Transform Data
- **Type**: Code node (JavaScript)
- **Purpose**: Extract and validate Gemini response
- **Functions**:
  - Removes markdown formatting (```json blocks)
  - Parses JSON response
  - Validates required fields (productName, expiryDate)
  - Normalizes nutrition object structure
  - Adds metadata (extractedAt timestamp, quantity=1)
- **Error Handling**: Returns error object if parsing fails

#### 4. Calculate Days to Expire
- **Type**: Code node (JavaScript)
- **Purpose**: Human-readable expiry calculation
- **Outputs**:
  - `daysToExpire`: Human-readable string
  - `expiryStatus`: Critical/Warning/Good/Expired
  - `daysToExpireRaw`: Integer days remaining
- **Format Examples**:
  - "Expires today", "Expires tomorrow"
  - "5 days", "1 week 3 days"
  - "2 months 1 week"
  - "Expired 10 days ago"

#### 5. Analyze Health Rating
- **Type**: Code node (JavaScript)
- **Purpose**: Calculate health score (0-99.9) based on ingredients and nutrition
- **Scoring Algorithm**:
  - **Base Score**: 100
  - **Penalties**:
    - Trans fats: -40
    - High fructose corn syrup: -25
    - Artificial sweeteners: -20
    - Sodium nitrite: -20
    - Artificial colors: -15
    - MSG: -15
    - High sugar (>15g/100g): -15
    - High sodium (>500mg/100g): -15
    - High saturated fat (>5g/100g): -15
    - Palm oil: -10
    - Multiple preservatives: -10
  - **Bonuses**:
    - High fiber (≥5g/100g): +5
    - High protein (≥10g/100g): +5
  - **Final Score**: Clamped to 0-99.9 range
- **Health Ratings**:
  - 80-100: "Healthy"
  - 60-79: "Moderate"
  - 40-59: "Not Healthy"
  - 0-39: "Harmful"
- **Outputs**:
  - `healthRating`: Category string
  - `healthScore`: Numeric score (0-99.9)
  - `concerns`: Array of health concern descriptions

#### 6. Prepare for Database
- **Type**: Code node (JavaScript)
- **Purpose**: Transform data types for Supabase schema compatibility
- **Transformations**:
  - `nutrition` object → `nutritionalInfo` JSON string
  - `concerns` array → `concernsText` newline-separated string
  - `healthScore` capped at 99.9 and rounded to 1 decimal place

#### 7. Store in Supabase
- **Type**: n8n-nodes-base.supabase
- **Operation**: Insert row into `products` table
- **Field Mappings**:
  ```
  product_name    → productName
  brand           → brand
  category        → category
  sub_category    → subCategory
  expiry_date     → expiryDate (DATE)
  mrp             → mrp (TEXT)
  weight          → weight (TEXT)
  ingredients     → ingredients (TEXT)
  nutritional_info → nutritionalInfo (TEXT/JSON)
  health_score    → healthScore (NUMERIC(3,1))
  health_rating   → healthRating (TEXT)
  concerns        → concernsText (TEXT)
  quantity        → quantity (INTEGER)
  date_added      → extractedAt (TIMESTAMP)
  ```

#### 8. Check Expiry Alert
- **Type**: n8n-nodes-base.if
- **Condition**: `daysToExpireRaw <= 7`
- **Purpose**: Determines if expiry alert should be sent
- **Note**: Alert functionality currently disabled (no WhatsApp node connected)

#### 9. Webhook Response
- **Type**: n8n-nodes-base.respondToWebhook
- **Format**: JSON
- **Response Structure**:
  ```json
  {
    "success": true,
    "product": "Product Name",
    "expiryDate": "2025-12-31",
    "daysToExpire": "2 months",
    "healthRating": "Moderate",
    "alertSent": false
  }
  ```

---

## Workflow 2: Multi-Image Analysis

**Webhook**: `POST https://n8n.kochar.dev/webhook/product-analyzer-multi`

### Node Flow
```
1. Webhook Trigger
   ↓
2. Prepare Images Array
   ↓
3. Split Out Images
   ↓
4. Gemini Vision API (Loop: per image)
   ↓
5. Parse Single Image Response
   ↓
6. Aggregate All Results
   ↓
7. Merge Results (Intelligent Strategy)
   ↓
8. Calculate Days to Expire
   ↓
9. Analyze Health Rating
   ↓
10. Prepare for Database
   ↓
11. Store in Supabase
   ↓
12. Webhook Response
```

### Key Differences from Single-Image Workflow

#### 2. Prepare Images Array
- **Type**: n8n-nodes-base.set
- **Purpose**: Extract binary image keys from FormData
- **Logic**:
  ```javascript
  Object.keys($binary)
    .filter(k => k.startsWith('image'))
    .map((key, index) => ({
      key,
      index,
      fileName: $binary[key].fileName || `image_${index}.jpg`
    }))
  ```
- **Output**: Array of image metadata objects

#### 3. Split Out Images
- **Type**: n8n-nodes-base.splitOut
- **Field**: `images` array
- **Purpose**: Creates one execution item per image for loop processing
- **Note**: Each item retains access to all binary images via `$json.key`

#### 4-5. Image Processing Loop
- **Sequential Processing**: Each image processed individually
- **Error Handling**: Failed images don't stop workflow
- **Metadata**: Each result tagged with `_imageIndex`, `_imageName`, `_extractionSuccess`

#### 6. Aggregate All Results
- **Type**: n8n-nodes-base.aggregate
- **Purpose**: Collects all loop results into single item with `data` array

#### 7. Merge Results (CRITICAL NODE)
- **Type**: Code node (JavaScript)
- **Purpose**: Intelligent merging of multiple image results
- **Input**: Array of parsed product data from all images
- **Output**: Single merged product object

**Merging Strategies**:

| Field | Strategy | Rationale |
|-------|----------|-----------|
| **Product Name** | LONGEST | Most descriptive text |
| **Brand** | LONGEST | Most complete brand info |
| **Category** | MOST FREQUENT | Voting consensus |
| **Sub-category** | MOST FREQUENT | Voting consensus |
| **Expiry Date** | EARLIEST | Safety first (conservative) |
| **MRP** | HIGHEST | Accurate retail price |
| **Weight** | MOST FREQUENT | Common value wins |
| **Ingredients** | DEDUPLICATE & MERGE | Captures all visible ingredients |
| **Nutrition** | AVERAGE (non-null) | Statistical accuracy |

**Confidence Calculation**:
- **Algorithm**: Measures field agreement across images
- **Scoring**:
  - Each field agreement: +11% (9 fields total)
  - Product name match: All identical = +11%
  - Brand match: All identical = +11%
  - Category match: All identical = +11%
  - Sub-category match: All identical = +11%
  - Expiry date match: All identical = +11%
  - MRP match: All identical = +11%
  - Weight match: All identical = +11%
  - Ingredients overlap: ≥70% Jaccard similarity = +11%
  - Nutrition agreement: ≥80% of values within 20% range = +11%
- **Range**: 0-100%
- **Interpretation**:
  - 90-100%: Excellent agreement
  - 80-89%: Very good
  - 70-79%: Good
  - 60-69%: Moderate (review recommended)
  - <60%: Low (manual review needed)

**Metadata Output**:
```json
{
  "_metadata": {
    "imagesProcessed": 3,
    "totalImages": 5,
    "failedImages": 2,
    "failedImageNames": ["image_2.jpg", "image_4.jpg"],
    "confidence": 87
  }
}
```

**Error Handling**:
- If all images fail: Throws error "All images failed to extract data"
- If some images fail: Merges successful results only
- Failed images tracked in metadata

#### 8-11. Post-Processing
- **Same as Single-Image Workflow**: Calculate Days to Expire, Analyze Health Rating, Prepare for Database, Store in Supabase

#### 12. Webhook Response
- **Format**: JSON with merged data + metadata
- **Structure**:
  ```json
  {
    "success": true,
    "data": {
      "productName": "...",
      "brand": "...",
      "category": "...",
      "expiryDate": "2025-12-31",
      "nutrition": { ... },
      "daysToExpire": "2 months",
      "healthRating": "Moderate",
      "healthScore": 67.5,
      "concerns": [ ... ]
    },
    "metadata": {
      "imagesProcessed": 3,
      "totalImages": 3,
      "failedImages": 0,
      "confidence": 95
    }
  }
  ```

---

## Shared Components

### Gemini Vision API Prompt
Both workflows use identical prompt:

```
Analyze this product packaging image and extract the following information for this consumable item:

- Product Name (full name including brand)
- Brand (manufacturer/brand name separately, e.g., "Britannia", "Parle", "Amul")
- Category (main product type: Snacks, Beverages, Dairy, Bakery, Confectionery, Frozen Foods, Ready to Eat, Condiments, etc.)
- Sub-category (specific type: Biscuits, Chips, Cookies, Chocolates, Juice, Milk, Cheese, Bread, etc.)
- Expiry Date (format as YYYY-MM-DD, look for "Best Before", "Exp Date", "Use By")
- MRP (Maximum Retail Price with currency symbol)
- Weight/Quantity (with unit like g, kg, ml, L)
- Ingredients (complete comma-separated list)
- Nutritional Information (key nutrients per 100g/100ml: Energy/Calories, Protein, Carbohydrates, Total Sugar, Total Fat, Saturated Fat, Trans Fat, Sodium, Fiber)

IMPORTANT: Return ONLY valid JSON with no markdown formatting or code blocks.

JSON format:
{
  "productName": "string",
  "brand": "string",
  "category": "string",
  "subCategory": "string",
  "expiryDate": "YYYY-MM-DD",
  "mrp": "string with currency",
  "weight": "string with unit",
  "ingredients": "comma-separated string",
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

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Auto-generated ID |
| `product_name` | TEXT | NOT NULL | Product name |
| `brand` | TEXT | | Brand/manufacturer |
| `category` | TEXT | | Main category |
| `sub_category` | TEXT | | Sub-category |
| `expiry_date` | DATE | | Expiry date |
| `mrp` | TEXT | | Maximum Retail Price |
| `weight` | TEXT | | Weight/quantity with unit |
| `ingredients` | TEXT | | Comma-separated ingredients |
| `nutritional_info` | TEXT | | JSON string of nutrition data |
| `health_score` | NUMERIC(3,1) | CHECK (health_score >= 0 AND health_score <= 99.9) | Health score 0-99.9 |
| `health_rating` | TEXT | | "Healthy", "Moderate", "Not Healthy", "Harmful" |
| `concerns` | TEXT | | Newline-separated health concerns |
| `quantity` | INTEGER | DEFAULT 1 | Quantity in inventory |
| `date_added` | TIMESTAMP | DEFAULT NOW() | When added to database |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update time |

---

## API Integration

### Single-Image Endpoint

**Web API**: `POST /api/analyze`
**n8n Webhook**: `POST https://n8n.kochar.dev/webhook/product-analyzer`

**Request** (FormData):
```javascript
const formData = new FormData()
formData.append('image', file) // Single File object

fetch('/api/analyze', {
  method: 'POST',
  body: formData
})
```

**Response**:
```typescript
{
  success: boolean
  product?: string
  expiryDate?: string
  daysToExpire?: string
  healthRating?: string
  alertSent?: boolean
  error?: string
}
```

### Multi-Image Endpoint

**Web API**: `POST /api/analyze-multiple`
**n8n Webhook**: `POST https://n8n.kochar.dev/webhook/product-analyzer-multi`

**Request** (FormData):
```javascript
const formData = new FormData()
formData.append('image0', file1)
formData.append('image1', file2)
formData.append('image2', file3)
// ... up to image4 (max 5 images)

fetch('/api/analyze-multiple', {
  method: 'POST',
  body: formData
})
```

**Response**:
```typescript
{
  success: boolean
  data?: {
    productName: string
    brand: string
    category: string
    expiryDate: string
    nutrition: object
    daysToExpire: string
    healthRating: string
    healthScore: number
    concerns: string[]
  }
  metadata?: {
    imagesProcessed: number
    totalImages: number
    failedImages: number
    failedImageNames?: string[]
    confidence: number
  }
  error?: string
  code?: string
}
```