# Product Analyzer Web Application

## Tech Stack

**Framework**: Next.js 15.5.4 (App Router, React 19)
**Language**: TypeScript
**Styling**: Tailwind CSS
**UI Components**: Radix UI + shadcn/ui
**State Management**: @tanstack/react-query (TanStack Query v5)
**Database**: Supabase (PostgreSQL)
**Image Processing**: react-dropzone, client-side compression
**Backend**: n8n workflows (external API)

---

## Architecture

```
Web Frontend (Next.js)
    ↓
API Routes (/api/*)
    ↓
n8n Webhooks (Analysis & Save)
    ↓
Supabase Database
```

### Environment Variables

```bash
# n8n Webhooks
N8N_WEBHOOK_URL=https://n8n.kochar.dev/webhook/product-analyzer
N8N_SAVE_WEBHOOK_URL=https://n8n.kochar.dev/webhook/save-product
N8N_MULTI_WEBHOOK_URL=https://n8n.kochar.dev/webhook/product-analyzer-multi

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://pvmliaqwdhbbeanmeubs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

---

## Core Pages

### 1. Dashboard (`/` - `app/page.tsx`)

**Purpose**: View, search, filter, and manage product inventory

**State Management**:
- `@tanstack/react-query` for data fetching (queryKey: `['products']`)
- Local state for filters (search, category, health, expiry)
- Mutation hooks for update/delete operations

**Features**:
- **Search**: Filters by product name, brand, ingredients, category
- **Filters**:
  - Category: All / [Dynamic categories from products]
  - Health: All / Healthy / Moderate / Not Healthy / Harmful
  - Expiry: All / Fresh / Expiring Month / Expiring Soon / Expired
- **Actions**: Edit, Delete, Mark as Consumed
- **Display**: Desktop table + mobile card view (responsive)
- **Pagination**: 10 items per page

**API Calls**:
- `GET /api/products` - Fetch all products
- `POST /api/update` - Update product (triggers query invalidation)
- `POST /api/delete` - Delete product (triggers query invalidation)

**Expiry Status Logic**:
```typescript
daysToExpire < 0 → 'expired'
daysToExpire <= 7 → 'expiring-soon'
daysToExpire <= 30 → 'expiring-month'
else → 'fresh'
```

---

### 2. Upload (`/upload` - `app/upload/page.tsx`)

**Purpose**: Multi-image product analysis workflow

**State Machine** (5 states):

| State | Description | Actions |
|-------|-------------|---------|
| `idle` | Initial state, no images | Upload images |
| `gallery` | Images selected | Add more, Remove, Analyze |
| `analyzing` | Analysis in progress | Cancel |
| `success` | Results ready | Edit & Save, Try Another |
| `error` | Analysis failed | Retry, Use New Image |

**Workflow**:
1. **Upload** (STATE 1) → Select 1-5 images → STATE 2
2. **Gallery** (STATE 2) → Add/remove images → Click "Analyze All"
3. **Analyzing** (STATE 3) → Show progress UI → Wait for n8n response
4. **Success** (STATE 4) → Display extracted data → Edit inline → Save to inventory
5. **Error** (STATE 5) → Show error message → Retry or start over

**Image Processing**:
- **Compression**: Max 2MB per image (uses `lib/utils/image-compression.ts`)
- **Validation** (via `lib/validation.ts`):
  - Min: 1 image, Max: 5 images
  - Max file size: 5MB per image
  - Max total size: 25MB
  - Allowed types: JPEG, PNG, WebP
- **Timeout**: 60 seconds for analysis

**API Calls**:
- `POST /api/analyze-multiple` - Multi-image analysis (FormData: `image0`, `image1`, ...)
- `POST /api/save` - Save extracted product to database

**Response Structure** (from n8n):
```typescript
{
  success: boolean
  data: {
    productName, brand, category, subCategory,
    expiryDate, mrp, weight, quantity,
    ingredients, nutrition, healthScore,
    healthRating, concerns
  }
  metadata: {
    imagesProcessed, totalImages, failedImages,
    failedImageNames, confidence
  }
}
```

---

## API Routes

### `/api/products` (GET)
- Fetches all products from Supabase `products` table
- Calculates `daysToExpire` dynamically from `expiry_date`
- Parses JSON fields (`nutritional_info`, `concerns`)

### `/api/products/[id]` (GET)
- Fetch single product by ID

### `/api/products/check-duplicate` (POST)
- Checks if product already exists (by name + brand + expiry)

### `/api/analyze` (POST - DEPRECATED, single-image only)
- Single-image analysis via n8n
- Replaced by `/api/analyze-multiple`

### `/api/analyze-multiple` (POST)
- **Input**: FormData with `image0`, `image1`, ... `image4`
- **Validation**: Uses `lib/validation.ts`
- **Processing**: Calls `analyzeMultipleProductImages()` from `lib/n8n.ts`
- **Output**: Product data + metadata (confidence, failed images)

### `/api/save` (POST)
- **Input**: Product data JSON
- **Duplicate Check**: Calls `/api/products/check-duplicate`
- **Processing**: Calls `saveProductToDatabase()` from `lib/n8n.ts`
- **n8n Workflow**: Triggers save webhook → Supabase insert
- **Error Handling**: Returns 409 if duplicate, 500 if save fails

### `/api/update` (POST)
- **Input**: `{ rowId: string, data: Partial<Product> }`
- **Processing**: Updates Supabase row directly (no n8n)
- **Recalculation**: If `expiryDate` changed, updates `daysToExpire`

### `/api/delete` (POST)
- **Input**: `{ rowId: string }`
- **Processing**: Deletes from Supabase directly (no n8n)

---

## Key Components

### Upload Flow Components

#### `ImageUpload` (`components/image-upload.tsx`)
- Drag-and-drop zone (react-dropzone)
- Multi-file selection (1-5 images)
- Mobile camera support
- Accessibility features (keyboard, screen reader)

#### `ImageGallery` (`components/upload/image-gallery.tsx`)
- Grid display of selected images
- Remove individual images
- Add more images (up to max 5)
- Image preview with file names

#### `AnalyzingState` (`components/upload/analyzing-state.tsx`)
- Loading spinner + progress message
- Shows image count being analyzed
- Cancel button (returns to idle state)

#### `ProductResults` (`components/upload/product-results.tsx`)
- **Editable Form**: Inline editing of all extracted fields
- **Nutrition Display**: Parsed from JSON response
- **Health Score**: Visual badge + concerns list
- **Metadata**: Shows confidence, images processed, failed images
- **Actions**: Save to Inventory, Try Another Product

#### `AnalysisError` (`components/upload/analysis-error.tsx`)
- Error message display
- Retry button (re-analyze same images)
- Use New Image button (reset to idle)

---

### Dashboard Components

#### `ProductTable` (`components/product-table.tsx`)
- **Desktop**: TanStack Table with sorting, pagination
- **Mobile**: Card view (via `ProductCard`)
- **Columns**: Product Name, Category, Health, Expiry, Quantity, Price, Actions
- **Sorting**: Product name, health score, expiry, quantity
- **Actions Dropdown**: Edit, Mark as Consumed, Delete

#### `ProductCard` (`components/product-card.tsx`)
- Mobile-optimized card layout
- Shows product name, brand, category, health, expiry
- Quick actions: Edit, Consume, Delete

#### `SearchFilter` (`components/search-filter.tsx`)
- Search input (debounced)
- Category dropdown
- Health rating filter
- Expiry status filter
- Clear all filters button

#### `EditProductDialog` (`components/edit-product-dialog.tsx`)
- Modal form for editing product details
- React Hook Form + Zod validation
- Updates via mutation hook

#### `DeleteConfirmDialog` (`components/delete-confirm-dialog.tsx`)
- Confirmation modal for deletion
- Shows product name for context

#### `ConsumeProductDialog` (`components/consume-product-dialog.tsx`)
- Quantity input (1 to current quantity)
- Decrements quantity or deletes if reaches 0

---

### UI Components

#### `HealthBadge` (`components/health-badge.tsx`)
- Visual indicator for health rating
- Color-coded: Green (Healthy), Yellow (Moderate), Orange (Not Healthy), Red (Harmful)
- Tooltip shows health score + concerns

#### `ExpiryBadge` (`components/expiry-badge.tsx`)
- Visual indicator for expiry status
- Color-coded: Gray (Fresh), Yellow (Expiring Month), Orange (Expiring Soon), Red (Expired)
- Shows formatted expiry date on hover

---

## Data Models

### `Product` Type (`types/product.ts`)

```typescript
interface Product {
  id: string                    // UUID from Supabase
  productName: string
  brand: string
  category: string
  subCategory: string
  expiryDate: string            // YYYY-MM-DD
  daysToExpire: number          // Calculated dynamically
  mrp: string                   // With currency symbol
  weight: string                // With unit (g, kg, ml, L)
  ingredients: string           // Comma-separated
  nutritionalInfo: string       // JSON string
  healthScore: number           // 0-99.9
  healthRating: string          // Healthy/Moderate/Not Healthy/Harmful
  concerns: string              // Newline-separated
  quantity: number              // Inventory count
  dateAdded: string             // Timestamp
}
```

### `NutritionData` Type

```typescript
interface NutritionData {
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
```

---

## Libraries & Utilities

### `lib/n8n.ts` - n8n Integration

**Functions**:

1. **`analyzeProductImage(imageFile)`** - Single-image analysis (deprecated)
   - Sends FormData to `N8N_WEBHOOK_URL`
   - Returns: `{ success, data, error }`

2. **`analyzeMultipleProductImages(imageFiles)`** - Multi-image analysis
   - Sends FormData with `image0`, `image1`, ... to `N8N_MULTI_WEBHOOK_URL`
   - 60-second timeout
   - Returns: `{ success, data, metadata, error }`

3. **`saveProductToDatabase(productData)`** - Save product
   - Sends JSON to `N8N_SAVE_WEBHOOK_URL`
   - 30-second timeout
   - Retry logic: 3 attempts with exponential backoff
   - Only retries on network errors or 5xx (not 4xx)
   - Returns: `{ success, data, error }`

**Error Handling**:
- Validates env vars at runtime (skips during build)
- Timeout handling via AbortController
- Detailed logging for debugging

---

### `lib/validation.ts` - Image Validation

**Rules**:
```typescript
minImages: 1
maxImages: 5
maxFileSize: 5MB per image
maxTotalSize: 25MB
allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
timeout: 60000ms (60 seconds)
```

**Error Codes**:
- `NO_IMAGES`, `TOO_MANY_IMAGES`, `INVALID_FILE_TYPE`
- `FILE_TOO_LARGE`, `TOTAL_SIZE_EXCEEDED`
- `ALL_IMAGES_FAILED`, `NETWORK_ERROR`, `TIMEOUT`, `UNKNOWN_ERROR`

**Functions**:
- `validateImageType(file)` - Check MIME type
- `validateImageSize(file)` - Check file size
- `validateTotalSize(files)` - Check total size
- `validateImageCount(count)` - Check count
- `validateImages(files)` - Validate all images

---

### `lib/utils/image-compression.ts` - Image Compression

**Function**: `compressImage(file, maxSizeMB)`

**Process**:
1. Create canvas element
2. Draw image at max 1920px width/height
3. Convert to JPEG with quality adjustment
4. Iterate quality (0.9 → 0.7 → 0.5) until < maxSizeMB
5. Return: `{ blob, preview, size }`

**Use Case**: Compress images before uploading to n8n (reduces bandwidth)

---

### `lib/db.ts` - Supabase Client

```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

**Tables**:
- `products` - Main product inventory table

---

## State Management

### React Query Configuration (`components/query-provider.tsx`)

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
})
```

**Query Keys**:
- `['products']` - All products
- `['product', id]` - Single product by ID

**Mutations**:
- Update product → Invalidates `['products']`
- Delete product → Invalidates `['products']`
- Save product → Redirects to `/` (dashboard auto-refreshes)

---

## Theme System

### `components/theme-provider.tsx`
- Uses `next-themes`
- Supports: `light`, `dark`, `system`
- Persisted in localStorage

### `components/theme-toggle.tsx`
- Dropdown menu in navigation
- Icons: Sun (light), Moon (dark), Monitor (system)

---

## Responsive Design

### Breakpoints (Tailwind defaults)
- `sm`: 640px (mobile landscape)
- `md`: 768px (tablet)
- `lg`: 1024px (desktop)
- `xl`: 1280px (large desktop)

### Mobile Optimizations
- **Dashboard**: Card view (`ProductCard`) on `< md`
- **Table**: Desktop table on `>= md`
- **Upload**: Optimized dropzone, mobile camera access
- **Navigation**: Hamburger menu (if implemented)

---

## Navigation (`components/navigation.tsx`)

**Structure**:
- Logo/Title
- Links: Dashboard (`/`), Upload (`/upload`)
- Theme toggle
- Responsive layout

---

## Error Handling

### Upload Page Errors
- **Timeout**: "Analysis timed out after 60 seconds. Try with fewer images or better quality photos."
- **Network**: "Could not connect to analysis service. Please check your internet connection."
- **API Error**: Displays n8n error message
- **Validation**: Shows validation errors from `lib/validation.ts`

### Dashboard Errors
- **Fetch Failure**: Shows error state with retry button
- **Update/Delete Failure**: Toast notification (destructive variant)

### Toast Notifications (`hooks/use-toast.ts`)
- Success: Product saved/updated/deleted
- Error: Operation failures
- Duplicate: Product already exists (409)

---

## Accessibility

### Features
- **Keyboard Navigation**: All interactive elements focusable
- **Screen Reader**: ARIA labels, live regions for state changes
- **Focus Management**: Dialogs trap focus
- **Color Contrast**: WCAG AA compliant
- **Alternative Text**: Images have descriptive alt text

### Announcements
- Upload state changes (images selected, analysis complete)
- Error messages (via `role="alert"`)
- Success messages (via `role="status"`)

---

## Performance Optimizations

### Client-Side
- **Image Compression**: Reduces upload size by 50-80%
- **Lazy Loading**: React.lazy for code splitting (if needed)
- **Memoization**: `useMemo` for filtered products
- **Debouncing**: Search input (if implemented)

### Server-Side
- **ISR**: Incremental Static Regeneration for static pages
- **Edge Functions**: API routes deployed to edge (Vercel)
- **Query Caching**: React Query caches for 5 minutes

---

## File Structure

```
web/
├── app/
│   ├── api/                  # API routes
│   │   ├── analyze/          # Single-image analysis (deprecated)
│   │   ├── analyze-multiple/ # Multi-image analysis
│   │   ├── save/             # Save product
│   │   ├── update/           # Update product
│   │   ├── delete/           # Delete product
│   │   └── products/         # Get products
│   ├── upload/
│   │   └── page.tsx          # Upload page
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Dashboard (home)
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── upload/               # Upload flow components
│   ├── product-table.tsx     # Product table
│   ├── product-card.tsx      # Mobile product card
│   ├── search-filter.tsx     # Search/filter UI
│   ├── edit-product-dialog.tsx
│   ├── delete-confirm-dialog.tsx
│   ├── consume-product-dialog.tsx
│   ├── health-badge.tsx
│   ├── expiry-badge.tsx
│   ├── navigation.tsx
│   ├── theme-provider.tsx
│   └── query-provider.tsx
├── lib/
│   ├── n8n.ts                # n8n API integration
│   ├── validation.ts         # Image validation
│   ├── db.ts                 # Supabase client
│   └── utils/
│       └── image-compression.ts
├── types/
│   └── product.ts            # TypeScript types
├── hooks/
│   └── use-toast.ts          # Toast hook
├── package.json
└── tsconfig.json
```
