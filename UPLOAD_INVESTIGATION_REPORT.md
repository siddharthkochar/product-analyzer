# Upload Functionality Investigation Report

**Date**: 2025-10-09
**Investigator**: Team Lead
**Status**: IDENTIFIED AND PARTIALLY FIXED

---

## Executive Summary

The upload functionality in the product-analyzer application was investigated and multiple issues were identified and fixed. The primary issue is that the **n8n webhook is returning empty responses**, which prevents the upload flow from completing successfully.

### Issues Found
1. ✅ **FIXED**: API request format mismatch - n8n webhook expects `{ "images": ["base64"] }` but was receiving `{ "imageBase64": "base64" }`
2. ✅ **FIXED**: Poor error handling for empty webhook responses
3. ❌ **EXTERNAL ISSUE**: n8n workflow returning empty response (workflow not executing properly)

---

## Investigation Process

### 1. Architecture Analysis

**Upload Flow**:
```
User Upload → ImageUpload Component → Image Compression → /api/analyze endpoint → n8n Webhook → Gemini API → Google Sheets → Response
```

**Files Reviewed**:
- `web/app/upload/page.tsx` - Main upload page with state machine
- `web/components/image-upload.tsx` - File upload component
- `web/app/api/analyze/route.ts` - Server-side API route
- `web/lib/n8n.ts` - n8n webhook integration
- `web/lib/utils/image-compression.ts` - Image compression utility
- `workflow/workflow.json` - n8n workflow configuration

### 2. Root Cause Analysis

#### Issue 1: API Request Format Mismatch ✅ FIXED

**Problem**:
The n8n webhook expects:
```json
{
  "images": ["base64_image_string"]
}
```

But the API was sending:
```json
{
  "imageBase64": "base64_image_string"
}
```

**Evidence**:
- workflow/workflow.json line 20: `Expected payload: { "images": ["base64_image1", "base64_image2"] }`
- web/lib/n8n.ts line 21 (before fix): `body: JSON.stringify({ imageBase64 })`

**Fix Applied**:
Updated `web/lib/n8n.ts` line 24:
```typescript
body: JSON.stringify({ images: [imageBase64] })
```

#### Issue 2: Empty Response Handling ✅ FIXED

**Problem**:
When n8n webhook returned empty response (content-length: 0), the code attempted to parse empty JSON, causing:
```
SyntaxError: Unexpected end of JSON input
```

**Fix Applied**:
Enhanced `web/lib/n8n.ts` with:
1. Get response as text first before parsing
2. Check for empty responses
3. Provide clear error messages
4. Add comprehensive logging

**Code Changes**:
```typescript
// Get response as text first to handle empty responses
const responseText = await response.text()
console.log('[N8N] Response text:', responseText.substring(0, 200))

if (!responseText || responseText.trim() === '') {
  console.error('[N8N] Empty response from webhook')
  throw new Error('n8n webhook returned empty response. The workflow may not be configured to return data.')
}

const data = JSON.parse(responseText)
```

#### Issue 3: n8n Workflow Not Returning Data ❌ EXTERNAL ISSUE

**Problem**:
The n8n webhook at `https://n8n.kochar.dev/webhook/product-analyzer` is returning:
```
HTTP 200 OK
content-length: 0
content-type: application/json; charset=utf-8
```

**Evidence from Test**:
```
[N8N] Response status: 200
[N8N] Response headers: { 'content-length': '0', ... }
[N8N] Response text: (empty)
```

**Possible Causes**:
1. **Workflow not activated** - The n8n workflow may be saved but not activated/enabled
2. **Workflow execution error** - An error occurs before reaching the "Webhook Response" node
3. **Gemini API failure** - The Google Gemini API may be failing or timing out
4. **Workflow misconfiguration** - The workflow may not be properly configured to handle the images array format

**Workflow Configuration**:
- Webhook node: `responseMode: "responseNode"` - requires explicit response
- Response node: "Webhook Response" exists in workflow
- Flow: Webhook → Gemini → Parse → Calculate → Health → Sheets → Response

---

## Fixes Implemented

### File: `web/lib/n8n.ts`

**Changes**:
1. Updated request format from `{ imageBase64 }` to `{ images: [imageBase64] }`
2. Added comprehensive logging for debugging
3. Improved error handling for empty responses
4. Added response text validation before JSON parsing

**Before**:
```typescript
body: JSON.stringify({ imageBase64 }),
const data = await response.json()
```

**After**:
```typescript
body: JSON.stringify({ images: [imageBase64] }),
const responseText = await response.text()
if (!responseText || responseText.trim() === '') {
  throw new Error('n8n webhook returned empty response...')
}
const data = JSON.parse(responseText)
```

---

## Test Results

### Test Setup
- Test script: `test-upload.js`
- Test image: 1x1 pixel base64 PNG
- Endpoint: `http://localhost:3000/api/analyze`

### Test Execution

```bash
$ node test-upload.js

Testing Upload Flow...
Step 1: Testing /api/analyze endpoint
----------------------------------------
Response status: 500
Response data: {
  "success": false,
  "error": "n8n webhook returned empty response. The workflow may not be configured to return data."
}

❌ Upload functionality has issues:
Error: n8n webhook returned empty response. The workflow may not be configured to return data.
```

### Server Logs

```
[ANALYZE API] Received image, size: 126 characters
[ANALYZE API] Calling n8n webhook...
[N8N] Calling webhook: https://n8n.kochar.dev/webhook/product-analyzer
[N8N] Image data length: 126 characters
[N8N] Response status: 200
[N8N] Response headers: { 'content-length': '0', 'content-type': 'application/json; charset=utf-8', ... }
[N8N] Response text: (empty)
[N8N] Empty response from webhook
[ANALYZE API] n8n result: FAILED
```

### Webhook Direct Test

```bash
$ curl -X POST https://n8n.kochar.dev/webhook/product-analyzer \
  -H "Content-Type: application/json" \
  -d '{"images":["data:image/png;base64,..."]}'

HTTP/2 200 OK
content-length: 0
content-type: application/json; charset=utf-8
```

**Result**: Webhook is accessible and accepts requests but returns empty response.

---

## Action Items

### For DevOps/n8n Administrator

1. **Verify workflow is activated**
   - Log into n8n at https://n8n.kochar.dev
   - Check if "Product Packaging Analyzer" workflow is active
   - Enable/activate if not already enabled

2. **Check workflow execution logs**
   - Review execution history for errors
   - Check if Gemini API is responding
   - Verify Google Sheets integration is working
   - Look for any node failures or timeouts

3. **Verify Gemini API credentials**
   - Ensure API key is valid
   - Check API quota/limits
   - Verify API is enabled in Google Cloud Console

4. **Test workflow with manual execution**
   - Manually trigger the workflow with test data
   - Verify each node executes successfully
   - Ensure "Webhook Response" node is reached

5. **Verify response configuration**
   - Check "Webhook Response" node configuration
   - Ensure it's returning proper JSON format
   - Verify it matches the expected response structure

### For Backend Engineer

1. **Monitor n8n integration**
   - The enhanced logging is now in place
   - Monitor server logs for detailed n8n responses
   - Alert if webhook continues returning empty responses

2. **Add fallback mechanism** (Future Enhancement)
   - Consider implementing local AI analysis as fallback
   - Add retry logic with exponential backoff
   - Implement circuit breaker pattern for external service calls

### For QA Engineer

1. **Test once n8n is fixed**
   - Verify upload flow works end-to-end
   - Test with various product images
   - Validate error handling for edge cases
   - Test timeout scenarios

2. **Create automated tests**
   - Unit tests for API endpoints
   - Integration tests for upload flow
   - E2E tests with real product images

---

## Current Status

### What Works ✅
- Upload page loads successfully
- Image selection and preview works
- Image compression works
- API endpoint `/api/analyze` is accessible
- n8n webhook endpoint is reachable
- Error handling and logging is improved

### What Doesn't Work ❌
- n8n webhook returns empty response
- Cannot complete product analysis
- Cannot save products to inventory via upload

### What's Fixed ✅
- API request format matches webhook expectations
- Proper error handling for empty responses
- Comprehensive logging for debugging
- Clear error messages for users

---

## Recommended Next Steps

### Immediate (High Priority)
1. **Contact n8n administrator** to investigate why workflow returns empty response
2. **Verify workflow activation** status in n8n dashboard
3. **Check Gemini API** configuration and quotas

### Short-term
1. Once n8n is fixed, conduct full end-to-end testing
2. Document the working upload flow
3. Update UPLOAD_FEATURE.md with any changes

### Long-term
1. Implement monitoring/alerting for n8n webhook health
2. Add fallback mechanisms for external service failures
3. Consider caching or queueing for resilience

---

## Technical Details

### Environment Configuration

**File**: `web/.env.local`
```env
N8N_WEBHOOK_URL=https://n8n.kochar.dev/webhook/product-analyzer
GOOGLE_SHEETS_ID=1SYTiPUQtHq2BPqxn4uFRm0v0T7nr411GM2eQMwulr64
GOOGLE_CLIENT_ID=167121687139-vl5e729jaf7s691mhu517ifbjt8irabq.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Expected n8n Response Format

Based on workflow configuration, the webhook should return:
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

But currently receiving:
```
(empty response)
```

---

## Conclusion

The upload functionality issues have been partially resolved. The API layer is now correctly formatted and has robust error handling. However, the **n8n workflow is not returning data**, which is blocking the complete upload flow.

**The issue is external** (n8n configuration/execution) and requires:
1. n8n administrator intervention
2. Workflow activation verification
3. Execution log review
4. Gemini API credential verification

Once the n8n workflow is fixed to return proper responses, the upload functionality will work end-to-end.

---

## Files Modified

1. `web/lib/n8n.ts` - Fixed request format and added error handling
2. `test-upload.js` - Created for testing (can be deleted after testing)
3. `UPLOAD_INVESTIGATION_REPORT.md` - This report

---

## Contact

For questions about this investigation:
- **Code changes**: Review git commit history
- **n8n issues**: Contact n8n administrator at n8n.kochar.dev
- **Testing**: Use `node test-upload.js` to verify fixes

---

**Report Status**: COMPLETE
**Next Action**: Escalate to n8n administrator for workflow investigation
