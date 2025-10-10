# Deployment Guide: Two-Webhook Architecture

## Overview
The product analyzer has been upgraded to support user editing before saving. The workflow now splits into two paths:
1. **Analyze Path**: Image → Analysis → Return results (NO database save)
2. **Save Path**: Edited data → Database insert

---

## Changes Made

### 1. N8N Workflow (`workflow/workflow-updated.json`)

**New Nodes:**
- `Webhook - Save Product` - New webhook at `/save-product` endpoint
- `Respond with Analysis Results` - Returns analysis without saving to DB

**Modified Flow:**
```
ANALYZE PATH:
Webhook (receive images)
  → Gemini Analysis
  → Parse & Transform
  → Calculate Expiry
  → Health Rating
  → Respond (NO DB SAVE)

SAVE PATH:
Webhook (save product)
  → Prepare for Database
  → Supabase Insert
  → Respond
```

### 2. Web Application

**Modified Files:**
- `components/upload/product-results.tsx` - Now editable form with react-hook-form
- `app/upload/page.tsx` - Updated handleSave to accept edited data
- `app/api/save/route.ts` - NEW: Endpoint for save webhook
- `app/api/products/route.ts` - Updated to use n8n save webhook
- `lib/n8n.ts` - Added `saveProductToDatabase()` function
- `.env.local` - Added `N8N_SAVE_WEBHOOK_URL`

---

## Deployment Steps

### Step 1: Update n8n Workflow

1. **Backup current workflow:**
   ```bash
   # The old workflow is at workflow/workflow.json
   cp workflow/workflow.json workflow/workflow-backup.json
   ```

2. **Import updated workflow:**
   - Open n8n: https://n8n.kochar.dev
   - Go to your "Product Packaging Analyzer" workflow
   - Click **"..."** menu → **"Import from File"**
   - Select `workflow/workflow-updated.json`
   - Or manually update your workflow with the new structure

3. **Verify webhook URLs:**
   - Analyze webhook: `https://n8n.kochar.dev/webhook/product-analyzer`
   - Save webhook: `https://n8n.kochar.dev/webhook/save-product`

4. **Test both webhooks:**
   ```bash
   # Test analyze webhook (with image)
   curl -X POST https://n8n.kochar.dev/webhook/product-analyzer \
     -F "image=@test-product.jpg"

   # Test save webhook (with JSON)
   curl -X POST https://n8n.kochar.dev/webhook/save-product \
     -H "Content-Type: application/json" \
     -d '{
       "productName": "Test Product",
       "brand": "Test Brand",
       "category": "Snacks",
       "expiryDate": "2025-12-31",
       "healthScore": 75,
       "healthRating": "Healthy",
       "quantity": 1
     }'
   ```

### Step 2: Update Environment Variables

1. **Verify `.env.local`:**
   ```bash
   cd web
   cat .env.local
   ```

   Should contain:
   ```env
   N8N_WEBHOOK_URL=https://n8n.kochar.dev/webhook/product-analyzer
   N8N_SAVE_WEBHOOK_URL=https://n8n.kochar.dev/webhook/save-product
   ```

2. **Update production environment (if applicable):**
   - Vercel/Railway/etc: Add `N8N_SAVE_WEBHOOK_URL` to environment variables

### Step 3: Test Locally

1. **Start development server:**
   ```bash
   cd web
   npm run dev
   ```

2. **Test the flow:**
   - Navigate to http://localhost:3000/upload
   - Upload a product image
   - Verify analysis returns without saving to DB
   - Edit the product information in the form
   - Click "Save to Inventory"
   - Verify product is saved to Supabase
   - Check no duplicate saves occurred

3. **Check logs:**
   ```bash
   # Watch for these log entries:
   # [N8N] Calling webhook: .../product-analyzer
   # [ANALYZE API] n8n result: SUCCESS
   # [N8N] Calling save webhook: .../save-product
   # [SAVE API] n8n save result: SUCCESS
   ```

### Step 4: Deploy to Production

1. **Push changes:**
   ```bash
   git add .
   git commit -m "feat: Add two-webhook architecture with editable product form"
   git push origin main
   ```

2. **Verify deployment:**
   - Check build logs for any errors
   - Test production URL with real product image
   - Verify data flows correctly

---

## How It Works Now

### User Flow:

1. **Upload Image:**
   - User uploads product image
   - Web app calls `/api/analyze`
   - n8n analyzes image and calculates health data
   - Returns structured data (NO save to DB)

2. **Review & Edit:**
   - User sees editable form with extracted data
   - Can modify any field (product name, expiry, etc.)
   - Health score and concerns remain read-only

3. **Save to Inventory:**
   - User clicks "Save to Inventory"
   - Web app calls `/api/save` with edited data
   - n8n saves to Supabase database
   - User redirected to dashboard

### Key Benefits:

✅ No duplicate saves
✅ User can correct OCR errors
✅ Single source of truth (n8n workflow)
✅ All business logic in n8n
✅ Clean separation of concerns

---

## Troubleshooting

### Issue: "n8n save webhook failed"
**Solution:** Verify `N8N_SAVE_WEBHOOK_URL` is set correctly in environment variables

### Issue: "Product already exists" on save
**Solution:** This is expected behavior - duplicate check is working

### Issue: Form not editable
**Solution:** Clear browser cache and hard refresh (Ctrl+F5)

### Issue: Analysis not returning data
**Solution:** Check n8n workflow is active and "Respond with Analysis Results" node is connected

---

## Rollback Plan

If issues occur:

1. **Rollback n8n workflow:**
   ```bash
   # Import workflow/workflow.json (original version)
   ```

2. **Rollback web app:**
   ```bash
   git revert HEAD
   git push origin main
   ```

3. **Restore environment variables:**
   - Remove `N8N_SAVE_WEBHOOK_URL`
   - Keep only `N8N_WEBHOOK_URL`

---

## Next Steps

- [ ] Test with various product images
- [ ] Monitor n8n execution logs for errors
- [ ] Add analytics to track edit frequency
- [ ] Consider adding field-level validation
- [ ] Add "Reset to Original" button in form

---

## Support

For issues or questions:
1. Check n8n execution logs
2. Check browser console for errors
3. Review server logs (`npm run dev`)
4. Verify webhook URLs are accessible
