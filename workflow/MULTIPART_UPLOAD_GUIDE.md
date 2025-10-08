# n8n Workflow Update Guide: Multipart/Form-Data File Upload

## Overview
The Product Analyzer workflow has been updated to receive image files via multipart/form-data instead of base64-encoded JSON.

## Changes Required in n8n Workflow

### 1. Webhook Node Configuration

The webhook node "Webhook - Receive Images" needs to be configured to accept multipart/form-data:

1. Open the workflow in n8n UI
2. Edit the "Webhook - Receive Images" node
3. Configure the following settings:
   - **HTTP Method**: POST (already set)
   - **Path**: product-analyzer (already set)
   - **Response Mode**: responseNode (already set)
   - **Options** > **Binary Data**: Enable this option
   - **Binary Property Name**: image (this is the form field name)

### 2. Verify Binary Data Flow

The workflow should now receive binary data from the webhook:

```
Webhook (binary data) → Analyze an image (Gemini) → Parse & Transform → ...
```

The Gemini node is already configured to use binary input (line 320: `"inputType": "binary"`), so it should work automatically once the webhook is configured.

### 3. Testing the Webhook

Test the updated webhook with curl:

```bash
# Test with a sample product image
curl -X POST https://n8n.kochar.dev/webhook/product-analyzer \
  -F "image=@/path/to/product-image.jpg"
```

Expected response:
```json
{
  "success": true,
  "product": "Product Name",
  "expiryDate": "2025-12-31",
  "daysToExpire": "X days",
  "healthRating": "Healthy",
  "alertSent": false
}
```

### 4. Workflow JSON Changes (If Editing Manually)

If you're updating the workflow JSON directly, modify the webhook node:

```json
{
  "parameters": {
    "httpMethod": "POST",
    "path": "product-analyzer",
    "responseMode": "responseNode",
    "options": {
      "binaryData": true,
      "binaryPropertyName": "image"
    }
  },
  "id": "webhook-trigger",
  "name": "Webhook - Receive Images",
  "type": "n8n-nodes-base.webhook",
  "typeVersion": 2,
  "position": [240, 304],
  "webhookId": "product-analyzer",
  "notes": "Receives product packaging images via POST request with multipart/form-data.\n\nExpected: File upload with field name 'image'"
}
```

### 5. Debugging

If the workflow fails, check:

1. **Webhook Execution Logs**: Check if the webhook receives the binary data
2. **Gemini Node Input**: Verify the Gemini node receives the binary image
3. **Binary Data Format**: Ensure the binary data is properly formatted
4. **Error Messages**: Check error messages in the workflow execution

Common issues:
- Webhook not configured for binary data
- Binary property name mismatch (should be "image")
- Gemini API not receiving the image data

### 6. Migration Notes

**Old Format (Base64 JSON)**:
```json
{
  "images": ["data:image/jpeg;base64,/9j/4AAQSkZJRg..."]
}
```

**New Format (Multipart/Form-Data)**:
```
POST /webhook/product-analyzer
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...

------WebKitFormBoundary...
Content-Disposition: form-data; name="image"; filename="product.jpg"
Content-Type: image/jpeg

<binary image data>
------WebKitFormBoundary...--
```

### 7. Benefits of This Change

1. **Reduced Bandwidth**: Binary upload is ~33% smaller than base64
2. **Better Performance**: No base64 encoding/decoding overhead
3. **Standard Protocol**: Uses standard HTTP multipart/form-data
4. **Easier Debugging**: Tools like Postman, curl work better with files
5. **Better Error Messages**: File type validation at API level

### 8. Rollback Plan

If you need to rollback:

1. Revert the webhook node to not require binary data
2. Update the "Analyze an image" node to accept JSON input
3. Add a code node to extract base64 from `{ images: [...] }` array
4. Redeploy the web application with the old code (commit hash in git)

## Testing Checklist

- [ ] Webhook accepts multipart/form-data requests
- [ ] Binary data is extracted from form field "image"
- [ ] Gemini API receives the image correctly
- [ ] Workflow executes successfully end-to-end
- [ ] Product data is returned in response
- [ ] Google Sheets integration still works
- [ ] WhatsApp alerts still work (if enabled)
- [ ] Test with PNG files
- [ ] Test with JPG files
- [ ] Test with WebP files
- [ ] Test with large files (>2MB)
- [ ] Test with small files (<100KB)

## Support

If you encounter issues:
1. Check n8n execution logs
2. Check web application console logs
3. Use browser DevTools Network tab to inspect requests
4. Test webhook directly with curl
5. Review Gemini API logs (if accessible)

## Updated Architecture Flow

```
Web UI (Upload Page)
  ↓ [File object]
Image Compression Utility
  ↓ [Compressed blob]
FormData Creation
  ↓ [multipart/form-data]
Next.js API Route (/api/analyze)
  ↓ [File validation & forwarding]
n8n Library (lib/n8n.ts)
  ↓ [FormData with file]
n8n Webhook (webhook-trigger)
  ↓ [Binary data]
Gemini API (Analyze an image)
  ↓ [Extracted text/JSON]
Parse & Transform Data
  ↓ [Structured product data]
Calculate Days to Expire
  ↓ [Expiry information]
Analyze Health Rating
  ↓ [Health score & concerns]
Store in Google Sheets
  ↓ [Data persistence]
Check Expiry Alert
  ↓ [Conditional logic]
Send WhatsApp Alert (if needed)
  ↓ [User notification]
Webhook Response
  ↓ [JSON response]
Next.js API Route
  ↓ [Response forwarding]
Web UI (Product Results)
```

## Code References

- **n8n Integration**: `web/lib/n8n.ts` (line 9: function signature)
- **API Route**: `web/app/api/analyze/route.ts` (line 6: FormData extraction)
- **Upload Page**: `web/app/upload/page.tsx` (line 98: FormData creation)
- **Image Compression**: `web/lib/utils/image-compression.ts` (line 11: interface)
- **n8n Workflow**: `workflow/workflow.json` (line 3-21: webhook node)
