# Product Analyzer

> Smart product inventory system using AI to analyze packaging, track expiry dates, and provide health ratings.

**Repository**: https://github.com/siddharthkochar/product-analyzer

---

## 📖 Overview

Product Analyzer is an automated system that:
- 📸 Analyzes product packaging images using Google Gemini AI
- 📅 Tracks expiry dates with human-readable alerts
- 💊 Provides health ratings and detailed nutritional concerns
- 🗄️ Stores product data in PostgreSQL (Supabase)
- 🌐 **NEW:** Web dashboard for inventory management (Phase 2 Complete!)
- ⚡ **NEW:** 10-100x faster performance with database migration (Phase 2.7 Complete!)
- 📱 **NEW:** Mobile-optimized UX with responsive design (Phase 2.10 Complete!)

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
- All products stored in PostgreSQL (Supabase)
- Indexed for fast queries (sub-100ms response times)
- Automatic timestamps (created_at, updated_at)
- UUID-based IDs for scalability

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
🔄 Prepare for Database
    │
    ↓ (format data types)
🗄️ Store in PostgreSQL (Supabase)
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
- **Database**: PostgreSQL via Supabase (free tier)
- **Web**: Next.js 15.5.4, React 19, shadcn/ui, TanStack Query
- **Messaging**: Evolution API (WhatsApp - currently disabled)

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

### 6. Prepare for Database
- **Function**: JavaScript code node
- **Transforms**:
  - nutrition object → JSON string (for TEXT column)
  - concerns array → newline-separated string (for TEXT column)
  - health_score capped at 99.9 (for NUMERIC(3,1) constraint)
- **Output**: Database-compatible formatted data

### 7. Store in PostgreSQL (Supabase)
- **Operation**: Insert row
- **Database**: Supabase PostgreSQL
- **Table**: products
- **Columns**: product_name, brand, category, sub_category, expiry_date, mrp, weight, ingredients, nutritional_info, health_score, health_rating, concerns, quantity, date_added

### 8. Check Expiry Alert
- **Type**: IF condition node
- **Condition**: `daysToExpireRaw <= 7 AND expiryStatus != "Expired"`
- **True**: Routes to WhatsApp Alert
- **False**: Routes to No Alert Needed

### 9. Send WhatsApp Alert (Disabled)
- **API**: Evolution API
- **Format**: Formatted message with product details and concerns
- **Status**: Currently disabled

### 10. Webhook Response
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

## 🗄️ PostgreSQL Database Schema (Supabase)

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| id | UUID | Primary key (auto-generated) | "123e4567-e89b-12d3-a456-426614174000" |
| product_name | TEXT | Full product name | "Kandee Factory MARSHMELTS" |
| brand | TEXT | Brand name | "Kandee Factory" |
| category | TEXT | Product category | "Confectionery" |
| sub_category | TEXT | Product sub-category | "Marshmallows" |
| expiry_date | DATE | Expiry date | "2024-06-29" |
| mrp | TEXT | Price with currency | "₹199.00" |
| weight | TEXT | Weight/quantity with unit | "100 grams" |
| ingredients | TEXT | Comma-separated list | "Sugar, Corn Flour, Gelatin..." |
| nutritional_info | TEXT | JSON string of nutrition data | "{\"energyKcal\":350,\"proteinG\":5.2,...}" |
| health_score | NUMERIC(3,1) | Numeric score 0-99.9 | 65.5 |
| health_rating | TEXT | Categorical rating | "Moderate" |
| concerns | TEXT | Newline-separated concerns | "High sugar content...\nContains artificial colors..." |
| quantity | INTEGER | Number of items | 1 |
| date_added | TIMESTAMPTZ | Timestamp with timezone | "2025-10-09T12:00:00Z" |
| created_at | TIMESTAMPTZ | Row creation time | "2025-10-09T12:00:00Z" |
| updated_at | TIMESTAMPTZ | Last update time | "2025-10-09T12:00:00Z" |

**Performance Indexes:**
- `idx_products_product_name` - Fast product name searches
- `idx_products_brand` - Fast brand filtering
- `idx_products_category` - Fast category filtering
- `idx_products_expiry_date` - Fast expiry date sorting
- `idx_products_health_score` - Fast health score sorting
- `idx_products_date_added` - Fast recent products queries
- `idx_products_name_brand` - Fast duplicate detection

---

## 🚀 Setup & Configuration

### Prerequisites
- n8n instance (running on Raspberry Pi or cloud)
- Google Gemini API key from [Google AI Studio](https://aistudio.google.com/)
- Supabase account (free tier) from [supabase.com](https://supabase.com)

### Environment Variables

**Web Application (.env.local):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
N8N_WEBHOOK_URL=https://n8n.kochar.dev/webhook/product-analyzer
```

**n8n Workflow:**
- Configure Supabase credentials in n8n
- Set up Google Gemini API credentials

### Supabase Setup
1. Create a new Supabase project
2. Run the SQL schema from `supabase-schema.sql` in SQL Editor
3. Copy Project URL and anon/public key
4. Add credentials to `.env.local` and n8n

### n8n Workflow Import
1. Import `workflow/workflow.json` into n8n
2. Configure Google Gemini credentials
3. Configure Supabase API credentials
4. Set Supabase project URL and API key
5. Activate workflow
6. Test with sample product image

---

## 📸 Upload Feature

The upload functionality allows users to capture or upload product images for AI analysis.

### State Machine (5 States)

1. **IDLE** - Camera/upload selection with device detection
2. **PREVIEW** - Image preview with "Analyze Product" button
3. **ANALYZING** - Loading state with spinner (30s timeout)
4. **SUCCESS** - Results display with save/retry options
5. **ERROR** - Error handling with retry capability

### Features

**Mobile Devices:**
- Camera capture with rear camera (`capture="environment"`)
- Direct photo capture from camera app
- Automatic preview after capture

**Desktop:**
- Drag-and-drop image upload
- Click to browse and select files
- File type validation (PNG, JPG, JPEG, WEBP, max 5MB)

**Image Processing:**
- Client-side compression (target: 2MB)
- Progressive quality reduction (0.9 to 0.5)
- Maintains aspect ratio
- Base64 encoding for API transmission

**Analysis & Save:**
- n8n webhook integration (30s timeout)
- Displays extracted product information
- Duplicate detection before saving
- Save to PostgreSQL database
- Redirects to dashboard on success
- Toast notifications for feedback

### User Flow

```
Mobile:  Take Photo → Preview → Analyze → View Results → Save → Dashboard
Desktop: Drag/Drop → Preview → Analyze → View Results → Save → Dashboard
```

### Error Handling

- **File Validation**: Invalid type or size (>5MB)
- **Network Errors**: Connection failures
- **Timeout**: Analysis taking too long (>30s)
- **No Data**: Product information not found
- **Duplicate**: Product already in inventory

All errors show clear messages with retry options.

### Accessibility

- WCAG 2.1 AA compliant
- ARIA labels and live regions
- Keyboard navigation support
- Screen reader announcements
- Focus management between states

---

## 📁 Project Structure

```
/product-analyzer/
├── README.md                  # This file - Product overview
├── plan.md                    # Development roadmap
├── supabase-schema.sql        # PostgreSQL database schema
├── workflow/                  # n8n workflow files
│   ├── workflow.json          # Main workflow configuration (with Supabase integration)
│   ├── extracted.json         # Sample Gemini API response
│   └── WORKFLOW_VALIDATION.md # Validation test report
└── web/                       # Next.js web application
    ├── app/                   # Next.js App Router pages
    ├── components/            # React components
    ├── lib/                   # Utilities and API clients
    │   ├── db.ts              # Supabase database client
    │   └── utils.ts           # Helper functions
    ├── types/                 # TypeScript type definitions
    └── package.json           # Dependencies
```

---

## 🐳 Docker & Deployment

### Docker Setup

The application is containerized using a multi-stage Dockerfile for optimal performance:

**Image Details:**
- **Base**: Alpine Linux (node:20-alpine)
- **Size**: ~200-300MB (optimized)
- **Platforms**: linux/amd64, linux/arm64 (Raspberry Pi compatible)
- **Security**: Non-root user, minimal attack surface

**Quick Start (Local):**
```bash
cd web
docker build -t product-analyzer-web .
docker-compose up -d
```

### Automated CI/CD with GitHub Actions

Every push to `main` automatically builds and deploys Docker images to DockerHub.

**Workflow Features:**
- ✅ Multi-platform builds (AMD64 + ARM64)
- ✅ Smart caching for faster builds (2-5 min)
- ✅ Automatic version tagging
- ✅ Build on PR (no push)
- ✅ Manual trigger support

**Workflow File:** `.github/workflows/docker-build-push.yml`

### DockerHub Setup (One-Time)

**1. Create DockerHub Repository**
- Go to https://hub.docker.com
- Create repository: `product-analyzer-web`
- Set visibility: Public

**2. Generate Access Token**
- Go to Settings → Security → https://hub.docker.com/settings/security
- Click "New Access Token"
- Description: `GitHub Actions - product-analyzer`
- Permissions: Read & Write
- Copy token (starts with `dckr_pat_`)

**3. Add GitHub Secrets**
- Go to: https://github.com/siddharthkochar/product-analyzer/settings/secrets/actions
- Add two secrets:
  - **`DOCKERHUB_USERNAME`**: Your DockerHub username
  - **`DOCKERHUB_TOKEN`**: Paste the access token

**4. Push to Trigger Build**
```bash
git push origin main
# Watch build at: github.com/siddharthkochar/product-analyzer/actions
```

### Deployment Workflow

```
Developer → git push main → GitHub Actions → DockerHub → Raspberry Pi
   (You)       (Trigger)       (Build)        (Store)      (Deploy)
```

**After GitHub Actions completes:**

```bash
# SSH into Raspberry Pi
ssh pi@raspberry-pi-ip

# Navigate to app directory
cd ~/apps/product-analyzer

# Pull latest image from DockerHub
docker-compose -f docker-compose.prod.yml pull

# Restart container
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker logs product-analyzer-web
```

### Environment Variables (Production)

Create `.env` file on Raspberry Pi:

```env
# n8n Webhook
N8N_WEBHOOK_URL=https://n8n.kochar.dev/webhook/product-analyzer

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# App
NEXT_PUBLIC_APP_URL=https://products.kochar.dev
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### Nginx Proxy Manager Configuration

- **Domain**: products.kochar.dev
- **Scheme**: http
- **Forward Hostname**: product-analyzer-web
- **Forward Port**: 3000
- **SSL**: Let's Encrypt certificate
- **HTTP/2**: Enabled
- **Cache Assets**: Enabled

### Manual Deployment Scripts

**Windows:**
```batch
deploy.bat
```

**Linux/Mac:**
```bash
./deploy.sh
```

These scripts build, tag, and push to DockerHub with interactive prompts.

### Version Releases

Create versioned releases with Git tags:

```bash
git tag v1.0.0
git push origin v1.0.0
```

This automatically builds and pushes with tags: `1.0.0`, `1.0`, `1`, `latest`

---

## 🎯 Completed Features

### Phase 1B: Enhanced Data Extraction ✅
- ✅ Category & sub-category detection
- ✅ Brand extraction
- ✅ Quantity tracking
- ⏸️ Duplicate product detection (deferred to Phase 3)

### Phase 2: Web Dashboard ✅
- ✅ Next.js 15.5.4 web interface with shadcn/ui
- ✅ Product listing with sortable columns
- ✅ Image upload via drag & drop with camera support
- ✅ Edit & delete products
- ✅ Health rating visualizations with tooltips
- ✅ Color-coded expiry status badges
- ✅ Dynamic expiry date calculation
- ✅ React Query for server state management
- ✅ TanStack Table for data tables
- ✅ Responsive design with Tailwind CSS
- ✅ Dark mode support
- ✅ Docker deployment with CI/CD pipeline

### Phase 2.7: Database Migration ✅
- ✅ Migrated from Google Sheets to PostgreSQL (Supabase)
- ✅ Created optimized database schema with indexes
- ✅ Built database access layer (lib/db.ts)
- ✅ Updated all API routes to use PostgreSQL
- ✅ Fixed n8n workflow data type mismatches
- ✅ Performance improvement: 10-100x faster queries
- ✅ Scalable architecture supporting thousands of products

### Phase 2.8: Docker & CI/CD ✅
- ✅ Multi-stage Dockerfile with Alpine Linux
- ✅ Docker Compose for local and production deployment
- ✅ Automated deployment scripts (Windows + Linux/Mac)
- ✅ Optimized image size (~200-300MB)

### Phase 2.9: GitHub Actions CI/CD Pipeline ✅
- ✅ Automated builds on push to main
- ✅ Multi-platform support (AMD64 + ARM64)
- ✅ DockerHub integration for image hosting
- ✅ Smart caching for faster builds (2-5 min)
- ✅ Version tagging and semantic releases
- ✅ Build on PR for validation
- ✅ Manual workflow trigger
- ✅ Consolidated documentation in README

### Phase 2.10: Mobile UX Improvements & Bug Fixes ✅
- ✅ Fixed critical save product bug with retry logic
- ✅ Health concerns accessible on mobile (expandable cards)
- ✅ Mobile-optimized button sizes (56px, WCAG compliant)
- ✅ Responsive dashboard with card layout on mobile
- ✅ Removed unnecessary "Added" column
- ✅ Comprehensive UX audit with recommendations
- ✅ Touch-friendly interactions throughout
- ✅ No horizontal scrolling on mobile devices

## 🎯 Upcoming Features

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
- **Database**: Migrated to PostgreSQL (Supabase free tier) for better performance and scalability
- **Performance**: 10-100x faster than Google Sheets (sub-100ms queries vs 500-2000ms)
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

**Last Updated**: 2025-10-11
**Workflow ID**: q3zvwWYkI6EKFMzi
**Version**: 2.10.0 (Phase 2.10 Complete - Mobile-Optimized UX!)
