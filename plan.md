# Product Analyzer - Development Plan

> **Repository**: https://github.com/siddharthkochar/product-analyzer

**For product overview and current features, see [README.md](README.md)**

---

## 🎯 Development Roadmap

### Phase 1A: n8n Workflow ✅ **COMPLETE**

**Status**: Production-ready
**Completed**: 2025-10-05
**Workflow ID**: q3zvwWYkI6EKFMzi

#### Delivered Features
- [x] Gemini AI Vision integration (gemini-2.5-flash)
- [x] Product data extraction (name, expiry, MRP, weight, ingredients, nutrition)
- [x] Human-readable expiry calculation
- [x] Health rating system (0-100 score + categorical)
- [x] User-friendly health concern messages
- [x] Google Sheets storage
- [x] Webhook API endpoint
- [x] Error handling and validation
- [x] Null-safe nutrition data handling

#### Technical Achievements
- Handles Gemini array response format
- Markdown code block cleanup
- Null-safe JavaScript throughout
- Comprehensive health scoring algorithm
- Detailed validation report

---

### Phase 1B: Category Detection & Project Restructuring ✅ **COMPLETE**

**Completed**: 2025-10-05
**Priority**: High

#### Tasks

**1. Project Organization** ✅
- [x] Rename project: `product-packaging-analyzer` → `product-analyzer`
- [x] Create folder structure with `workflow/` subdirectory
- [x] Create comprehensive README.md
- [x] Update development plan
- [x] Initialize git repository
- [x] Create `.gitignore`
- [x] Push to GitHub

**2. Enhanced Data Extraction** ✅
- [x] Update Gemini prompt to extract category, sub-category, brand
- [x] Update Parse & Transform node to handle new fields
- [x] Added default values: brand="Unknown", category="Uncategorized", subCategory="Other"
- [x] Added quantity field (default: 1) for future duplicate detection

**3. Google Sheets Schema Update** ✅
- [x] Add columns: Category, Sub-category, Brand, Quantity
- [x] Update workflow mappings
- [x] Workflow pushed to n8n successfully

**4. Git Setup** ✅
- [x] Create `.gitignore` (exclude .env, sensitive data)
- [x] Initial commit with current state
- [x] Add remote: https://github.com/siddharthkochar/product-analyzer
- [x] Push to main branch
- [x] Configure SSH key for GitHub
- [x] Committed Phase 1B changes

#### `.gitignore` Template
```gitignore
# Environment variables
.env
.env.local
.env.*.local

# n8n sensitive data
credentials.json
*.key

# Next.js (for future web/)
.next/
out/
node_modules/
.DS_Store
*.log

# Docker
*.tar
.dockerignore

# IDE
.vscode/
.idea/
*.swp
```

#### New Google Sheets Columns
| Column | Type | Description | Example |
|--------|------|-------------|---------|
| Category | String | Main product category | "Snacks", "Beverages", "Dairy" |
| Sub-category | String | Product subcategory | "Biscuits", "Chips", "Chocolates" |
| Brand | String | Brand name | "Britannia", "Parle", "Amul" |
| Quantity | Number | Number of items (default: 1) | 1, 2, 3 |

#### Enhanced Gemini Prompt (Draft)
```
Analyze this product packaging image and extract:
- Product Name (full name including brand)
- Brand (manufacturer/brand name separately)
- Category (main type: Snacks/Beverages/Dairy/Bakery/etc)
- Sub-category (specific type: Biscuits/Chips/Cookies/etc)
- Expiry Date (YYYY-MM-DD format)
- MRP (with currency)
- Weight/Quantity (with unit)
- Ingredients (complete list)
- Nutritional Information (per 100g/100ml)

Return ONLY valid JSON with no markdown.
```

---

### Phase 2: Web Dashboard ✅ **COMPLETE**

**Status**: Production-ready
**Completed**: 2025-10-08
**Priority**: High

#### Technology Stack

**Frontend Framework**
- Next.js 15.5.4 (App Router)
- TypeScript
- React 19

**UI Components**
- shadcn/ui + Radix UI
- Tailwind CSS
- lucide-react icons

**Data Management**
- TanStack Query (React Query) - server state
- TanStack Table - data tables
- React Hook Form + Zod - forms & validation

**File Upload**
- react-dropzone - drag & drop
- Base64 encoding for image upload

**API Integration**
- Next.js API Routes (serverless functions)
- Google Sheets API client
- n8n webhook integration

#### Project Structure
```
/apps/product-analyzer/web/
├── app/
│   ├── page.tsx                    # Dashboard (product list)
│   ├── upload/
│   │   └── page.tsx                # Image upload page
│   ├── layout.tsx                  # Root layout
│   ├── globals.css                 # Global styles
│   └── api/
│       ├── analyze/route.ts        # POST - forward to n8n
│       ├── products/route.ts       # GET - fetch all products
│       └── products/[id]/route.ts  # PUT/DELETE - update/delete
├── components/
│   ├── ui/                         # shadcn components
│   │   ├── button.tsx
│   │   ├── table.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── badge.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── alert.tsx
│   ├── ProductTable.tsx            # Main data table
│   ├── ImageUpload.tsx             # Drag & drop upload
│   ├── ProductCard.tsx             # Product display card
│   ├── SearchFilter.tsx            # Search/filter controls
│   ├── HealthBadge.tsx             # Health rating badge
│   └── ExpiryBadge.tsx             # Expiry status badge
├── lib/
│   ├── google-sheets.ts            # Google Sheets API client
│   ├── n8n.ts                      # n8n webhook client
│   ├── utils.ts                    # Utility functions
│   └── validations.ts              # Zod schemas
├── types/
│   └── product.ts                  # TypeScript interfaces
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

#### Development Tasks

**Week 1: Setup & Core Components (Days 1-3)**

**Day 1: Project Initialization** ✅
- [x] Create Next.js project with TypeScript
- [x] Install dependencies (shadcn/ui, TanStack Query/Table, etc.)
- [x] Configure Tailwind CSS
- [x] Setup shadcn/ui components
- [x] Create base layout and navigation
- [x] Configure environment variables

**Day 2: API Integration** ✅
- [x] Setup Google Sheets API client with OAuth2
- [x] Create API route: `GET /api/products` (read from Sheets)
- [x] Create API route: `POST /api/analyze` (forward to n8n)
- [x] Create API route: `POST /api/update` (update Sheet row)
- [x] Create API route: `POST /api/delete` (delete Sheet row)
- [x] Create API route: `POST /api/products/check-duplicate`
- [x] Test all endpoints with curl
- [x] Fixed column mapping after Phase 1B changes
- [x] Implemented dynamic expiry date calculation
- [x] Fixed delete functionality with dynamic sheetId lookup

**Day 3: Core Components** ✅
- [x] Build `ImageUpload` component with react-dropzone
- [x] Build `ProductTable` component with TanStack Table
- [x] Build `HealthBadge` component (color-coded ratings with tooltips)
- [x] Build `ExpiryBadge` component (status indicators)
- [x] Create TypeScript types for Product
- [x] Build dialog components (Edit, Delete, Consume)

**Week 2: Pages & Features (Days 4-5)** ✅

**Day 4: Upload Page** ✅
- [x] Create `/upload` page
- [x] Implement image preview
- [x] Implement base64 conversion
- [x] Integrate with `POST /api/analyze`
- [x] Show loading states
- [x] Display extraction results
- [x] Error handling and retry logic
- [ ] Add duplicate detection check (deferred)

**Day 5: Dashboard Page** ✅
- [x] Create `/` dashboard page
- [x] Integrate ProductTable with TanStack Query
- [x] Implement sorting (expiry date, health score, date added)
- [x] Add pagination
- [x] Implement edit dialog (React Hook Form)
- [x] Implement delete confirmation dialog
- [x] Add "Mark as Consumed" action
- [x] Fixed all data display bugs (column mapping, expiry calculation, health scores)
- [ ] Implement search functionality (deferred to Phase 3)
- [ ] Implement filters (category, health rating, expiry status) (deferred to Phase 3)

**Week 3: Deployment (Days 6-7)** 📅 **PENDING**

**Day 6: Docker Setup**
- [ ] Create multi-stage Dockerfile
  - Stage 1: Dependencies installation
  - Stage 2: Build Next.js app
  - Stage 3: Production runtime
- [ ] Create `docker-compose.yml` for local testing
- [ ] Create `.dockerignore`
- [ ] Build image locally
- [ ] Test container locally
- [ ] Optimize image size

**Day 7: Production Deployment**
- [ ] Push Docker image to GitHub Container Registry
- [ ] Pull image on Raspberry Pi
- [ ] Create docker-compose for production
- [ ] Setup environment variables
- [ ] Run container with proper networking
- [ ] Configure nginx-proxy-manager
  - Domain: `products.kochar.dev` (or similar)
  - SSL certificate
  - Proxy to container port
- [ ] End-to-end testing
- [ ] Performance optimization

#### Features Breakdown

**1. Upload Page Features**
- Drag & drop image upload
- Click to select file
- Image preview with thumbnail
- Clear/remove image
- Upload button with loading state
- Progress indicator during analysis
- Results display:
  - Product name, expiry, health rating
  - All extracted fields
  - Success/error messages
- Duplicate detection warning
- Quick action: "View in Dashboard"

**2. Dashboard Features**
- Product table with columns:
  - Product Name (with brand)
  - Category → Sub-category
  - Expiry Date (with badge)
  - Days to Expire (color-coded)
  - Health Score (with badge)
  - MRP
  - Weight
  - Actions (Edit, Delete, View)
- Search bar (searches name, brand, ingredients)
- Filters:
  - Category (dropdown)
  - Sub-category (dropdown, filtered by category)
  - Health Rating (multi-select)
  - Expiry Status (multi-select)
- Sort by: Expiry date, Health score, Date added
- Pagination (20 items per page)
- Row click → Expand to show:
  - Ingredients
  - Nutritional info
  - Concerns
- Action buttons:
  - Edit (opens dialog)
  - Delete (confirmation)
  - Mark as Consumed

**3. Edit Dialog**
- Form with all editable fields
- Zod validation
- Save → Update Google Sheets
- Cancel → Close dialog

**4. Additional Features**
- Dark mode toggle (optional)
- Responsive design (mobile-first)
- Loading skeletons
- Empty states
- Error boundaries
- Toast notifications

#### Docker Configuration

**Dockerfile (Multi-stage)**
```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

**docker-compose.yml**
```yaml
version: '3.8'

services:
  web:
    build: .
    container_name: product-analyzer-web
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - N8N_WEBHOOK_URL=${N8N_WEBHOOK_URL}
      - GOOGLE_SHEETS_ID=${GOOGLE_SHEETS_ID}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - GOOGLE_REFRESH_TOKEN=${GOOGLE_REFRESH_TOKEN}
    restart: unless-stopped
    networks:
      - nginx-proxy-manager_default

networks:
  nginx-proxy-manager_default:
    external: true
```

#### Environment Variables
```env
# n8n Webhook
N8N_WEBHOOK_URL=https://n8n.kochar.dev/webhook/product-analyzer

# Google Sheets
GOOGLE_SHEETS_ID=1SYTiPUQtHq2BPqxn4uFRm0v0T7nr411GM2eQMwulr64
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REFRESH_TOKEN=xxx

# App
NEXT_PUBLIC_APP_URL=https://products.kochar.dev
```

---

### Phase 3: Advanced Features 📅 **FUTURE**

**Target Start**: TBD
**Priority**: Medium-Low

#### Feature List

**1. Duplicate Detection with Quantity Management**
- [ ] Detect duplicate products by name/brand
- [ ] Show dialog: "This product already exists. What would you like to do?"
  - Option 1: Increase quantity (+1)
  - Option 2: Add as new entry (different batch/expiry)
  - Option 3: Discard scan
- [ ] Update quantity field in Google Sheets
- [ ] Track quantity changes in history

**2. Brand Analytics**
- [ ] Brand-based filtering in dashboard
- [ ] Brand comparison view
- [ ] Top brands by health score
- [ ] Brand preference tracking

**3. Price Intelligence**
- [ ] Calculate price per unit (₹/100g, ₹/100ml)
- [ ] Price comparison within category
- [ ] Best value suggestions
- [ ] Price history tracking

**4. Consumption Tracking**
- [ ] "Mark as Consumed" button with date picker
- [ ] Consumption history
- [ ] Average consumption rate per product
- [ ] Predictive replenishment alerts

**5. Shopping List**
- [ ] Auto-generate based on consumption patterns
- [ ] Manual add to shopping list
- [ ] Shopping list page
- [ ] Export shopping list

**6. Product Comparison**
- [ ] Select multiple products to compare
- [ ] Side-by-side comparison table
- [ ] Highlight best/worst values
- [ ] Compare within same category
- [ ] Healthier alternatives suggestion

**7. Barcode Scanning (Optional)**
- [ ] Frontend: Implement quagga.js or zxing-js
- [ ] Camera access for barcode reading
- [ ] API integration: Open Food Facts
- [ ] Workflow update: Try barcode first, fallback to image
- [ ] Verify AI-extracted data against barcode database
- [ ] Benefits:
  - Faster product identification
  - Cost savings (skip Gemini API call if barcode succeeds)
  - Data verification
  - Access to manufacturer certifications

**8. Bulk Scanning**
- [ ] Multi-file upload (queue multiple images)
- [ ] Sequential processing (one by one)
- [ ] Progress tracking (e.g., "Processing 3 of 10...")
- [ ] Individual error handling
- [ ] Batch results summary
- [ ] Option to review before saving

---

## 🎯 Success Metrics

### Phase 1B (Target)
- ✅ Category extraction accuracy >80%
- ✅ Brand extraction accuracy >80%
- ✅ Clean folder structure
- ✅ Code on GitHub with proper .gitignore
- ✅ Updated Google Sheets schema

### Phase 2 (Target)
- ✅ Web interface deployed and accessible
- ✅ Upload → Analysis → Display flow working
- ✅ Search/filter/sort functioning correctly
- ✅ Edit/delete operations successful
- ✅ Docker container running on Raspberry Pi
- ✅ nginx-proxy-manager SSL configured
- ⚡ Page load time <2 seconds
- ⚡ Image upload → analysis <5 seconds

### Phase 3 (Target)
- User engagement with advanced features
- Reduction in duplicate entries
- Active use of consumption tracking
- Shopping list utilization

---

## 📅 Timeline Estimate

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 1A: Workflow | 3 days | ✅ Complete |
| Phase 1B: Categories & Git | 1-2 days | 🔄 In Progress |
| Phase 2: Web Dashboard | 5-7 days | 📅 Planned |
| Phase 3: Advanced Features | Ongoing | 📅 Future |

**Total Estimated Time to MVP (Phase 2)**: ~10 days

---

## 🚀 Development Workflow

### Git Branching Strategy
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - Feature branches
- `fix/*` - Bug fix branches

### Commit Guidelines
- Prefix commits: `feat:`, `fix:`, `docs:`, `chore:`
- Keep commits atomic and focused
- Reference issues where applicable

### Deployment Process

**n8n Workflow:**
1. Update `workflow/workflow.json` locally
2. Test changes in n8n UI
3. Export updated workflow
4. Commit to git
5. Push via n8n API or manual import

**Web Frontend:**
1. Develop locally with `npm run dev`
2. Test all features
3. Build: `docker build -t product-analyzer-web .`
4. Tag: `docker tag product-analyzer-web ghcr.io/siddharthkochar/product-analyzer-web:latest`
5. Push: `docker push ghcr.io/siddharthkochar/product-analyzer-web:latest`
6. Deploy on Pi: `docker pull` → `docker-compose up -d`
7. Configure nginx-proxy-manager
8. Test in production

---

## 💡 Technical Decisions

### Approved Decisions
✅ Next.js with App Router (modern, serverless-ready)
✅ shadcn/ui (customizable, accessible components)
✅ Google Sheets as database (sufficient for <1000 products)
✅ Next.js API Routes (no separate backend needed)
✅ Docker deployment (consistent environments)
✅ Sequential bulk scanning (simpler than batch)
✅ Category/sub-category/brand extraction
✅ Duplicate detection with quantity tracking

### Deferred/Rejected
❌ WhatsApp notifications (replaced with web dashboard)
❌ Allergen detection (not needed)
❌ Export options (not needed now)
❌ Inventory value tracking (not needed)
❌ Multi-user access (single-user, publicly accessible)
❌ API rate limiting (not needed yet)
⏸️ Batch image processing (defer to Phase 3)
⏸️ PostgreSQL migration (only if >1000 products)

### Open Questions
- Migrate to PostgreSQL when? (if >1000 products or complex queries needed)
- Mobile app needed? (would require tRPC/separate backend)
- Barcode scanning priority? (optional, can add later)
- How to handle products with multiple variants? (size/flavor)

---

## 📝 Notes for Developers

### Key Files
- `workflow/workflow.json` - n8n workflow configuration
- `workflow/extracted.json` - Sample Gemini response for testing
- `workflow/WORKFLOW_VALIDATION.md` - Node-by-node validation report
- `web/lib/google-sheets.ts` - Google Sheets API client (to be created)
- `web/lib/n8n.ts` - n8n webhook client (to be created)

### Important Patterns
- **Null Safety**: Always use `!= null` checks for nutrition values
- **Error Handling**: Workflow continues even if fields are missing
- **Array Format**: Gemini returns `[{content: {parts: [{text: "..."}]}}]`
- **Markdown Cleanup**: Strip ` ```json ` and ` ``` ` before parsing
- **Type Safety**: Use TypeScript interfaces for all API responses

### Testing Checklist
- [ ] Test with products having missing nutritional data
- [ ] Test with expired products
- [ ] Test with products expiring soon (<7 days)
- [ ] Test with very healthy products (high fiber, high protein)
- [ ] Test with harmful products (trans fats, HFCS)
- [ ] Test with null/undefined values
- [ ] Test with malformed images
- [ ] Test duplicate detection
- [ ] Test category extraction with various product types

---

**Last Updated**: 2025-10-08
**Current Phase**: Phase 2 Complete ✅ (Web Dashboard Production-Ready)
**Next Milestone**: Phase 2 - Docker Deployment or Phase 3 - Advanced Features
**Workflow Version**: Updated at 2025-10-05T15:00:44.135Z
**Git Commits**: Multiple (Initial commit + Phase 1B + Phase 2 Web Dashboard)
