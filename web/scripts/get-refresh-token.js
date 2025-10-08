/**
 * Script to obtain Google OAuth2 Refresh Token
 *
 * This script helps you get a refresh token for Google Sheets API access.
 *
 * STEPS:
 * 1. Go to: https://developers.google.com/oauthplayground
 * 2. Click the gear icon (⚙️) in the top right
 * 3. Check "Use your own OAuth credentials"
 * 4. Enter your OAuth Client ID and Client Secret from .env.local:
 *    - OAuth Client ID: 167121687139-vl5e729jaf7s691mhu517ifbjt8irabq.apps.googleusercontent.com
 *    - OAuth Client Secret: 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
 * 5. Click "Close"
 * 6. In the left panel under "Step 1", find and select:
 *    "Google Sheets API v4" -> "https://www.googleapis.com/auth/spreadsheets"
 * 7. Click "Authorize APIs" button
 * 8. Sign in with your Google account that has access to the sheet
 * 9. Click "Allow" to grant permissions
 * 10. You'll be redirected back to OAuth Playground
 * 11. Click "Exchange authorization code for tokens" button
 * 12. Copy the "Refresh token" value
 * 13. Paste it into .env.local as GOOGLE_REFRESH_TOKEN
 *
 * IMPORTANT:
 * - Make sure your OAuth consent screen is configured in Google Cloud Console
 * - Add https://developers.google.com/oauthplayground as an authorized redirect URI
 * - The Google account you use must have access to the spreadsheet
 */

console.log('='.repeat(80))
console.log('GOOGLE OAUTH2 REFRESH TOKEN GENERATOR')
console.log('='.repeat(80))
console.log('')
console.log('Follow these steps to get your refresh token:')
console.log('')
console.log('1. Open: https://developers.google.com/oauthplayground')
console.log('')
console.log('2. Click the gear icon (⚙️) in top right corner')
console.log('   - Check ✓ "Use your own OAuth credentials"')
console.log('   - OAuth Client ID: 167121687139-vl5e729jaf7s691mhu517ifbjt8irabq.apps.googleusercontent.com')
console.log('   - OAuth Client Secret: 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')
console.log('   - Click "Close"')
console.log('')
console.log('3. In left panel, select API:')
console.log('   - Expand "Google Sheets API v4"')
console.log('   - Select "https://www.googleapis.com/auth/spreadsheets"')
console.log('')
console.log('4. Click "Authorize APIs" button')
console.log('   - Sign in with Google account that owns the sheet')
console.log('   - Click "Allow" to grant permissions')
console.log('')
console.log('5. Click "Exchange authorization code for tokens"')
console.log('')
console.log('6. Copy the "Refresh token" value')
console.log('')
console.log('7. Add to .env.local:')
console.log('   GOOGLE_REFRESH_TOKEN=<paste-token-here>')
console.log('')
console.log('='.repeat(80))
console.log('')
console.log('TROUBLESHOOTING:')
console.log('- If you get "redirect_uri_mismatch" error:')
console.log('  Go to Google Cloud Console > APIs & Services > Credentials')
console.log('  Edit your OAuth 2.0 Client ID')
console.log('  Add: https://developers.google.com/oauthplayground')
console.log('  to "Authorized redirect URIs"')
console.log('')
console.log('- Your spreadsheet ID: 1SYTiPUQtHq2BPqxn4uFRm0v0T7nr411GM2eQMwulr64')
console.log('  Make sure the Google account has access to this sheet!')
console.log('')
console.log('='.repeat(80))
