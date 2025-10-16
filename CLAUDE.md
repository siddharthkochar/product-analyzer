# Claude Code Reference - Product Analyzer

> **Quick Reference Document for AI Context**
>
> This document provides essential navigation and context for working with the Product Analyzer codebase. Always refer to specific documentation files for detailed information.

---

## Project Overview

**Product Analyzer** - Smart product inventory system using AI to analyze packaging, track expiry dates, and provide health ratings.

**Tech Stack**: Next.js 15.5.4 (React 19) + n8n workflows + Google Gemini AI + Supabase (PostgreSQL)

**Version**: 3.1.0 (Multi-Image Capture Complete)

**Repository**: https://github.com/siddharthkochar/product-analyzer

---

## Architecture

```
Web Frontend (Next.js)
    ↓ API Routes
n8n Webhooks
    ↓ Gemini Vision AI
Supabase Database (PostgreSQL)
```

**Core Features**: Multi-image analysis (1-5 images), AI extraction, health rating (0-100), expiry tracking, web dashboard

---

## Documentation Map

**Always refer to these files for detailed information:**

| Topic | File | What to Find |
|-------|------|--------------|
| **Web Application** | `web/web.md` | Pages, components, API routes, state management, types, utilities |
| **n8n Workflows** | `workflow/workflow.md` | Node-by-node workflow, merging strategies, confidence calculation, health rating algorithm |
| **Deployment** | `deployment/deployment.md` | Docker setup, environment variables, CI/CD, production deployment |
| **Database** | `supabase-schema.sql` | Complete schema with indexes and constraints |
| **Project Overview** | `README.md` | Features, setup instructions, architecture diagrams |
| **Development Plan** | `plan.md` | Implementation phases and roadmap |

**Additional References**:
- Multi-image implementation: `workflow/MULTI_IMAGE_WORKFLOW_GUIDE.md`
- Implementation summary: `MULTI_IMAGE_IMPLEMENTATION_SUMMARY.md`

---

## File Structure

```
product-analyzer/
├── web/                    # Next.js application → See web/web.md
│   ├── app/               # Pages (page.tsx, upload/page.tsx) + API routes (/api/*)
│   ├── components/        # React components (upload/, ui/, dialogs, tables)
│   ├── lib/              # n8n.ts, validation.ts, db.ts, utils/
│   └── types/            # product.ts (TypeScript definitions)
├── workflow/              # n8n JSON files → See workflow/workflow.md
├── deployment/            # Docker files → See deployment/deployment.md
└── test-images/          # Sample images for testing
```

---

## Environment Variables

**Required for Runtime** (create `.env.local` in `web/`):

```bash
# n8n Webhooks
N8N_WEBHOOK_URL=https://n8n.kochar.dev/webhook/product-analyzer
N8N_SAVE_WEBHOOK_URL=https://n8n.kochar.dev/webhook/save-product
N8N_MULTI_WEBHOOK_URL=https://n8n.kochar.dev/webhook/product-analyzer-multi

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://pvmliaqwdhbbeanmeubs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>

# App
NEXT_PUBLIC_APP_URL=https://product-analyzer.yourdomain.com
```

**See**: `deployment/deployment.md` for production environment setup

---

## Key Concepts

### Multi-Image Merging Strategies

**See**: `workflow/workflow.md` Section: "Workflow 2: Multi-Image Analysis → Merge Results"

Quick reference:
- **LONGEST**: Product name, brand (most descriptive)
- **MOST FREQUENT**: Category, weight (voting)
- **EARLIEST**: Expiry date (safety first)
- **HIGHEST**: MRP (accurate price)
- **DEDUPLICATE & MERGE**: Ingredients
- **AVERAGE**: Nutrition values

### Health Rating System

**See**: `workflow/workflow.md` Section: "Analyze Health Rating"

- Base score: 100
- Penalties: -10 to -40 (harmful ingredients), -15 to -30 (high sugar/sodium/fat)
- Bonuses: +5 (fiber/protein)
- Ratings: Healthy (80-100), Moderate (60-79), Not Healthy (40-59), Harmful (0-39)

---

## Quick Navigation

### Web Application Details
**File**: `web/web.md`

Find information about:
- API routes (`/api/products`, `/api/analyze-multiple`, `/api/save`, etc.)
- Page components (Dashboard, Upload workflow)
- Component hierarchy (ProductTable, ImageGallery, etc.)
- State management (React Query configuration)
- Data models (Product type, NutritionData)
- Utilities (n8n.ts, validation.ts, image-compression.ts)

### n8n Workflow Details
**File**: `workflow/workflow.md`

Find information about:
- Single-image workflow (9 nodes)
- Multi-image workflow (12 nodes)
- Merging algorithms with code
- Confidence calculation (9 factors)
- Health rating scoring system
- Error handling strategies
- Supabase schema mapping

### Deployment Details
**File**: `deployment/deployment.md`

Find information about:
- Dockerfile multi-stage build
- docker-compose.yml (development vs production)
- Environment variable setup
- Docker commands (build, run, logs)
- CI/CD with GitHub Actions
- Reverse proxy configuration (Nginx/NPM)
- Health checks and monitoring

---

## Common Tasks

### Need to understand a component?
→ Check `web/web.md` Component Hierarchy section

### Need to modify the workflow?
→ Check `workflow/workflow.md` for node descriptions, then edit in n8n UI

### Need to deploy changes?
→ Check `deployment/deployment.md` for deployment instructions

### Need to add an API route?
→ Check `web/web.md` API Routes section for patterns and examples

### Need database schema information?
→ Check `supabase-schema.sql` for full schema or `web/web.md` for summary

### Need to troubleshoot?
→ Check specific documentation file based on issue area:
  - Web errors: `web/web.md` Error Handling section
  - Workflow errors: `workflow/workflow.md` Error Handling section
  - Deployment errors: `deployment/deployment.md` Troubleshooting section

---

## Development Workflow

```bash
# Local development
cd web
npm install
npm run dev  # http://localhost:3000

# Docker development
cd deployment
docker-compose up -d

# Deployment
git push origin main  # GitHub Actions auto-builds
# Then SSH to server and pull latest image
```

**See**: `deployment/deployment.md` for complete deployment workflow

---

## Important Files Quick Reference

**Configuration**:
- `web/package.json` - Dependencies
- `web/tsconfig.json` - TypeScript config
- `web/next.config.js` - Next.js config
- `deployment/Dockerfile` - Docker build config
- `deployment/docker-compose.yml` - Local dev setup
- `deployment/docker-compose.prod.yml` - Production setup

**Core Libraries**:
- `web/lib/n8n.ts` - n8n API integration (analyzeMultipleProductImages, saveProductToDatabase)
- `web/lib/validation.ts` - Image validation rules (max 5 images, 5MB each, 25MB total)
- `web/lib/db.ts` - Supabase client
- `web/types/product.ts` - TypeScript types

**Detailed docs for each**: See `web/web.md`

---

## Testing

**Test Images**: Located in `test-images/` directory

**Manual Testing Checklist**:
- Upload single/multiple images → Verify extraction
- Check confidence score (multi-image)
- Save, edit, delete products
- Search/filter functionality
- Mobile responsiveness

---

## Git Workflow

**Commit Conventions**: `feat:`, `fix:`, `docs:`, `refactor:`, `style:`, `perf:`

**Versioning**: Semantic versioning (`v1.0.0`, `v1.1.0`) - push tags for versioned Docker builds

---

## Resources

- **n8n Instance**: https://n8n.kochar.dev
- **Supabase Dashboard**: https://pvmliaqwdhbbeanmeubs.supabase.co
- **Gemini API**: https://aistudio.google.com

---

## When You Need Details...

| Question | Check This File |
|----------|----------------|
| How does the upload page work? | `web/web.md` → Upload section |
| What's the merging algorithm? | `workflow/workflow.md` → Merge Results node |
| How to deploy to production? | `deployment/deployment.md` → Production Deployment |
| What are all the API endpoints? | `web/web.md` → API Routes |
| How does health scoring work? | `workflow/workflow.md` → Analyze Health Rating |
| What's the database schema? | `supabase-schema.sql` or `web/web.md` → Database Schema |
| How to add a new component? | `web/web.md` → Component Hierarchy |
| Docker build failing? | `deployment/deployment.md` → Troubleshooting |

---

**Last Updated**: 2025-10-16

**Remember**: This is a navigation document. Always read the specific documentation files for detailed information.
