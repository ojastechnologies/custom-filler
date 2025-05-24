// Test script to verify image deletion URL parsing fixes
// This script tests the URL parsing logic for Supabase Storage image paths

function testImageUrlParsing(imageUrl) {
  console.log('\n=== Testing URL parsing for:', imageUrl, '===');
  
  if (!imageUrl) {
    console.log('❌ No URL provided');
    return false;
  }
  
  // Check if it's a placeholder image
  if (imageUrl === '/placeholder-product.jpg' || imageUrl.includes('placeholder')) {
    console.log('✅ Placeholder image - skipping');
    return true;
  }
  
  // Extract the full file path from the Supabase Storage URL
  let filePath = '';
  
  if (imageUrl.includes('/storage/v1/object/public/images/')) {
    // Full Supabase Storage URL: extract everything after '/images/'
    const imagePart = imageUrl.split('/storage/v1/object/public/images/')[1];
    if (imagePart) {
      filePath = imagePart.split('?')[0]; // Remove query parameters
    }
    console.log('📄 Full Supabase URL detected');
  } else if (imageUrl.startsWith('products/')) {
    // Already in the correct format
    filePath = imageUrl.split('?')[0];
    console.log('📄 Relative path format detected');
  } else if (imageUrl.includes('/')) {
    // Try to extract filename and assume it's in products folder
    const fileName = imageUrl.split('/').pop()?.split('?')[0] || '';
    if (fileName && fileName.includes('.')) {
      filePath = `products/${fileName}`;
    }
    console.log('📄 Extracting filename and adding products/ prefix');
  }
  
  if (!filePath || !filePath.includes('/')) {
    console.log('❌ Could not extract valid file path from URL');
    return false;
  }
  
  console.log('📁 Extracted file path:', filePath);
  
  // Validate the file path
  if (filePath === 'products/' || !filePath.startsWith('products/')) {
    console.log('❌ Invalid file path format - Expected: products/filename.ext');
    return false;
  }
  
  console.log('✅ Valid file path extracted:', filePath);
  console.log('🗑️  Would delete from bucket "images" with path:', filePath);
  
  return true;
}

// Test cases
const testUrls = [
  // Full Supabase Storage URLs
  'https://project-id.supabase.co/storage/v1/object/public/images/products/test-product.jpg',
  'https://abc123.supabase.co/storage/v1/object/public/images/products/another-product.png?t=2024-01-01',
  
  // Relative paths
  'products/simple-product.jpg',
  'products/product-with-query.png?v=123',
  
  // URLs that need filename extraction
  'https://example.com/some/path/filename.jpg',
  '/local/path/to/image.png',
  
  // Edge cases
  '/placeholder-product.jpg',
  '',
  null,
  'products/',
  'invalid-path-no-extension',
];

console.log('🧪 Testing Image URL Parsing Logic for Supabase Storage');
console.log('='.repeat(60));

testUrls.forEach((url, index) => {
  console.log(`\nTest ${index + 1}:`);
  testImageUrlParsing(url);
});

console.log('\n' + '='.repeat(60));
console.log('✅ URL parsing tests completed!');
console.log('\n📋 Summary of fixes applied to productsService.ts:');
console.log('   • Fixed deleteProductImage() to extract full paths like "products/filename.jpg"');
console.log('   • Fixed deleteProductImageDirect() for REST API calls');
console.log('   • Enhanced error handling and logging');
console.log('   • Added path validation for proper format');
console.log('   • Added fallback logic for different URL formats');
