/**
 * Test script for the save product functionality
 * This script tests the /api/save endpoint with various scenarios
 */

const BASE_URL = 'http://localhost:3000'

// Test product data
const validProduct = {
  productName: 'Test Biscuits',
  brand: 'Test Brand',
  category: 'Snacks',
  subCategory: 'Biscuits',
  expiryDate: '2025-12-31',
  mrp: '₹50',
  weight: '200g',
  quantity: 1,
  ingredients: 'Wheat flour, Sugar, Palm oil',
  nutritionalInfo: JSON.stringify({
    energy: '450 kcal',
    protein: '6g',
    carbs: '70g',
    fat: '15g'
  }),
  healthScore: 65,
  healthRating: 'Moderate',
  concerns: 'Contains palm oil\nHigh in sugar',
  nutrition: {
    energy: '450 kcal',
    protein: '6g',
    carbs: '70g',
    fat: '15g'
  }
}

const productWithoutName = {
  ...validProduct,
  productName: ''
}

const productWithoutExpiry = {
  ...validProduct,
  expiryDate: ''
}

async function testSaveEndpoint(testName, productData, expectedStatus) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`TEST: ${testName}`)
  console.log(${'='.repeat(60)})

  try {
    const response = await fetch(`${BASE_URL}/api/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    })

    const result = await response.json()

    console.log(`Status Code: ${response.status}`)
    console.log(`Expected: ${expectedStatus}`)
    console.log(`Response:`, JSON.stringify(result, null, 2))

    if (response.status === expectedStatus) {
      console.log('✅ TEST PASSED')
    } else {
      console.log('❌ TEST FAILED - Unexpected status code')
    }

    return { success: response.status === expectedStatus, response, result }
  } catch (error) {
    console.log(`❌ TEST FAILED - Error: ${error.message}`)
    console.error('Error details:', error)
    return { success: false, error }
  }
}

async function runTests() {
  console.log('Testing Save Product Functionality')
  console.log(`Base URL: ${BASE_URL}`)
  console.log(`Timestamp: ${new Date().toISOString()}`)

  // Test 1: Valid product - should succeed (200 or 409 if already exists)
  await testSaveEndpoint(
    'Valid Product Save',
    validProduct,
    200 // or 409 if already exists
  )

  await new Promise(resolve => setTimeout(resolve, 1000))

  // Test 2: Product without name - should fail with 400
  await testSaveEndpoint(
    'Product Without Name (Validation Error)',
    productWithoutName,
    400
  )

  await new Promise(resolve => setTimeout(resolve, 1000))

  // Test 3: Product without expiry date - should fail with 400
  await testSaveEndpoint(
    'Product Without Expiry Date (Validation Error)',
    productWithoutExpiry,
    400
  )

  console.log(`\n${'='.repeat(60)}`)
  console.log('ALL TESTS COMPLETED')
  console.log(${'='.repeat(60)}\n`)
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error running tests:', error)
  process.exit(1)
})
