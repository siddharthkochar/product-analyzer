# Product Analyzer

> Smart product inventory system using AI to analyze packaging, track expiry dates, and provide health ratings.

**Repository**: https://github.com/siddharthkochar/product-analyzer

---

## 📖 Overview

Product Analyzer is an automated system that:
- 📸 Analyzes product packaging images using Google Gemini AI
- 📅 Tracks expiry dates with human-readable alerts
- 💊 Provides health ratings and detailed nutritional concerns
- 📊 Stores product data in Google Sheets
- 🌐 (Coming Soon) Web dashboard for inventory management

---

## ✨ Current Features

### Product Information Extraction
- **Product Name** - Full name including brand
- **Expiry Date** - Formatted as YYYY-MM-DD
- **MRP** - Maximum Retail Price with currency symbol
- **Weight/Quantity** - With units (g, kg, ml, L)
- **Ingredients** - Complete comma-separated list
- **Nutritional Information** - Energy, protein, carbs, sugar, fat, sodium, fiber (per 100g/100ml)

### Smart Calculations
- **Days to Expire** - Human-readable format:
  - "Expires today" / "Expires tomorrow"
  - "2 weeks 3 days"
  - "2 months 1 week"
  - "Expired 45 days ago"

### Health Rating System
- **Score**: 0-100 numeric score
- **Rating**: Healthy / Moderate / Not Healthy / Harmful
- **Detailed Concerns**: User-friendly explanations like:
  - ✅ "Contains artificial sweeteners which may affect metabolism and gut health"
  - ✅ "High sugar content (70.47g per 100g) - linked to weight gain and diabetes"
  - ✅ "Contains trans fats which increase bad cholesterol and heart disease risk"

### Data Storage
- All products stored in Google Sheets
- Searchable and filterable data
- Timestamp tracking for each scan

---

## 🏗️ Architecture

### Current Workflow (n8n)

```
📥 Webhook (POST /product-analyzer)
    │
    ↓ (receives image)
🤖 Google Gemini Vision AI
    │
    ↓ (extracts JSON)
🔄 Parse & Transform
    │
    ↓ (validates data)
📅 Calculate Days to Expire
    │
    ↓ (human-readable format)
💊 Analyze Health Rating
    │
    ↓ (score + concerns)
📊 Store in Google Sheets
    │
    ↓ (check expiry)
⚠️  Alert Check (≤7 days?)
    │
    ├─→ 📱 WhatsApp Alert (disabled)
    └─→ ✅ No Alert Needed
    │
    ↓
📤 Webhook Response (JSON)
```

### Technology Stack
- **AI**: Google Gemini 2.5 Flash (Vision)
- **Automation**: n8n workflow
- **Storage**: Google Sheets
- **Messaging**: Evolution API (WhatsApp - currently disabled)
- **Web** (Coming Soon): Next.js 14, shadcn/ui, TanStack Table

---

## 📋 Workflow Nodes

### 1. Webhook Trigger
- **Type**: POST endpoint
- **Path**: `/product-analyzer`
- **Input**: Binary image data
- **Output**: Passes image to Gemini

### 2. Google Gemini - Analyze Image
- **Model**: gemini-2.5-flash
- **Input**: Product packaging image
- **Prompt**: Extracts product name, expiry, MRP, weight, ingredients, nutrition
- **Output**: JSON response (in array format)

### 3. Parse & Transform Data
- **Function**: JavaScript code node
- **Handles**:
  - Array response format from Gemini
  - Markdown code block cleanup (removes ` ```json ` tags)
  - JSON parsing and validation
  - Null-safe field extraction
  - Error handling for missing data
- **Output**: Structured product object

### 4. Calculate Days to Expire
- **Function**: JavaScript code node
- **Logic**:
  - Compares expiry date with current date
  - Generates human-readable format
  - Sets status (Expired/Critical/Warning/Good)
- **Output**: Adds `daysToExpire`, `expiryStatus`, `daysToExpireRaw`

### 5. Analyze Health Rating
- **Function**: JavaScript code node
- **Analyzes**:
  - Harmful ingredients (trans fats, HFCS, artificial sweeteners, MSG, etc.)
  - Nutritional values (sugar, sodium, saturated fat, trans fat)
  - Beneficial nutrients (fiber, protein)
- **Scoring**:
  - Base score: 100
  - Penalties: -10 to -40 per harmful ingredient
  - Nutritional penalties: -15 to -30 points
  - Bonuses: +5 for high fiber/protein
- **Output**: Adds `healthRating`, `healthScore`, `concerns[]`

### 6. Store in Google Sheets
- **Operation**: Append row
- **Spreadsheet**: Configured via OAuth2
- **Columns**: Product Name, Expiry Date, Days to Expire, MRP, Weight, Ingredients, Date Added, Health Ratings, Health Score, Concerns

### 7. Check Expiry Alert
- **Type**: IF condition node
- **Condition**: `daysToExpireRaw <= 7 AND expiryStatus != "Expired"`
- **True**: Routes to WhatsApp Alert
- **False**: Routes to No Alert Needed

### 8. Send WhatsApp Alert (Disabled)
- **API**: Evolution API
- **Format**: Formatted message with product details and concerns
- **Status**: Currently disabled

### 9. Webhook Response
- **Type**: Respond to Webhook
- **Format**: JSON
- **Fields**: success, product, expiryDate, daysToExpire, healthRating, alertSent

---

## 📊 Health Rating Logic

### Scoring System (0-100)

**Starting Score**: 100

**Harmful Ingredients (Penalties)**:
| Ingredient | Penalty | Pattern |
|------------|---------|---------|
| Trans fats / Hydrogenated oils | -40 | `trans.?fat\|partially hydrogenated\|hydrogenated oil` |
| High fructose corn syrup | -25 | `high.?fructose.?corn.?syrup\|hfcs` |
| Artificial sweeteners | -20 | `aspartame\|sucralose\|saccharin\|acesulfame` |
| Sodium nitrite | -20 | `sodium.?nitrite\|e250` |
| Artificial colors | -15 | `tartrazine\|e102\|e110\|e129\|sunset yellow\|red 40` |
| MSG | -15 | `monosodium.?glutamate\|msg\|e621` |
| Palm oil | -10 | `palm.?oil` |
| Multiple preservatives | -10 | Multiple E2xx codes |

**Nutritional Thresholds (Penalties)**:
| Nutrient | Threshold | Penalty |
|----------|-----------|---------|
| Sugar | > 15g/100g | -15 |
| Sodium | > 500mg/100g | -15 |
| Saturated Fat | > 5g/100g | -15 |
| Trans Fat | > 0g/100g | -30 |

**Beneficial Nutrients (Bonuses)**:
| Nutrient | Threshold | Bonus |
|----------|-----------|-------|
| Fiber | ≥ 5g/100g | +5 |
| Protein | ≥ 10g/100g | +5 |

**Final Rating**:
- **80-100**: Healthy (green)
- **60-79**: Moderate (yellow)
- **40-59**: Not Healthy (orange)
- **0-39**: Harmful (red)

---

## 📊 Google Sheets Schema

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| Product Name | String | Full product name | "Kandee Factory MARSHMELTS" |
| Expiry Date | Date | YYYY-MM-DD format | "2024-06-29" |
| Days to Expire | String | Human-readable | "Expired 463 days ago" |
| MRP | String | Price with currency | "₹199.00" |
| Weight | String | Weight/quantity with unit | "100 grams" |
| Ingredients | Text | Comma-separated list | "Sugar, Corn Flour, Gelatin..." |
| Date Added | DateTime | ISO timestamp | "2025-10-05T07:58:44.585Z" |
| Health Ratings | String | Categorical rating | "Moderate" |
| Health Score | Number | Numeric score 0-100 | 85 |
| Concerns | Text | Comma-separated concerns | "High sugar content (59.16g per 100g) - linked to weight gain and diabetes" |

---

## 🚀 Setup & Configuration

### Prerequisites
- n8n instance (running on Raspberry Pi or cloud)
- Google Gemini API key from [Google AI Studio](https://aistudio.google.com/)
- Google Cloud project with Sheets API enabled
- OAuth2 credentials for Google Sheets

### Environment Variables
```env
N8N_API_KEY=your_n8n_api_key
GOOGLE_SHEETS_ID=1SYTiPUQtHq2BPqxn4uFRm0v0T7nr411GM2eQMwulr64
```

### Google Sheets Setup
1. Create a new Google Sheet
2. Add header row with columns (see schema above)
3. Share sheet with service account email
4. Copy spreadsheet ID from URL
5. Configure in n8n Google Sheets node

### n8n Workflow Import
1. Import `workflow/workflow.json` into n8n
2. Configure Google Gemini credentials
3. Configure Google Sheets OAuth2 credentials
4. Set spreadsheet ID and sheet name
5. Activate workflow
6. Test with sample product image

---

## 📁 Project Structure

```
/apps/product-analyzer/
├── README.md              # This file - Product overview
├── plan.md                # Development roadmap
└── workflow/              # n8n workflow files
    ├── workflow.json      # Main workflow configuration
    ├── extracted.json     # Sample Gemini API response
    └── WORKFLOW_VALIDATION.md  # Validation test report
```

---

## 🎯 Upcoming Features

### Phase 1B: Enhanced Data Extraction
- Category & sub-category detection
- Brand extraction
- Duplicate product detection
- Quantity tracking

### Phase 2: Web Dashboard
- Next.js web interface with shadcn/ui
- Product listing with search & filters
- Image upload via drag & drop
- Edit & delete products
- Category-based filtering
- Health rating visualizations
- Docker deployment on Raspberry Pi

### Phase 3: Advanced Features
- Barcode scanning with fallback to image recognition
- Bulk product scanning
- Consumption tracking
- Shopping list generation
- Price per unit comparison
- Healthier product suggestions

---

## 📝 Notes

- **AI Model**: Using `gemini-2.5-flash` for cost efficiency and good vision capabilities
- **Storage**: Google Sheets sufficient for initial scale (migrate to PostgreSQL if >1000 products)
- **Null Safety**: All nutrition values handle null/missing data gracefully
- **Error Handling**: Workflow continues even if some fields are missing
- **Response Format**: Gemini returns array format with nested content structure

---

## 📜 License

MIT License - See LICENSE file for details

---

## 🤝 Contributing

This is a personal project. Feel free to fork and adapt for your own use.

---

**Last Updated**: 2025-10-05
**Workflow ID**: q3zvwWYkI6EKFMzi
**Version**: 1.0.0
