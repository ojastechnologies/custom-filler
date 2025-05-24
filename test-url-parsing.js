// Test script to validate image URL parsing
const testUrls = [
  // Full Supabase Storage URLs
  'https://rjkrmxzjhoxhtgvohjvy.supabase.co/storage/v1/object/public/images/products/product-1735046400000.jpg',
  'https://rjkrmxzjhoxhtgvohjvy.supabase.co/storage/v1/object/public/images/products/product-1735046400000.jpg?version=123',
  
  // Already correct format
  'products/product-1735046400000.jpg',
  'products/product-1735046400000.jpg?v=1',
  
  // Path with filename only
  '/images/upload/product-1735046400000.jpg',
  'something/product-1735046400000.jpg',
  
  // Invalid cases
  '/placeholder-product.jpg',
  'invalid-url',
  ''
];

function testImageUrlParsing(imageUrl) {
  console.log('\n=== Testing URL Parsing ===');
  console.log('Input URL:', imageUrl);
  
  let filePath = '';
  
  if (imageUrl.includes('/storage/v1/object/public/images/')) {
    // Full Supabase Storage URL: extract everything after '/images/'
    const imagePart = imageUrl.split('/storage/v1/object/public/images/')[1];
    if (imagePart) {
      filePath = imagePart.split('?')[0]; // Remove query parameters
    }
    console.log('Detected: Full Supabase Storage URL');
    console.log('Extracted image part:', imagePart);
  } else if (imageUrl.startsWith('products/')) {
    // Already in the correct format
    filePath = imageUrl.split('?')[0];
    console.log('Detected: Already in correct format');
  } else if (imageUrl.includes('/')) {
    // Try to extract filename and assume it's in products folder
    const fileName = imageUrl.split('/').pop()?.split('?')[0] || '';
    if (fileName && fileName.includes('.')) {
      filePath = `products/${fileName}`;
    }
    console.log('Detected: Path with filename');
    console.log('Extracted filename:', fileName);
  }
  
  console.log('Final file path:', filePath);
  console.log('Valid path?', filePath && filePath.includes('/') && filePath.startsWith('products/'));
  console.log('DELETE URL would be:', `SUPABASE_URL/storage/v1/object/images/${filePath}`);
  console.log('=== End Test ===\n');
  
  return filePath;
}

console.log('🔍 Testing Image URL Parsing Logic\n');

testUrls.forEach(url => {
  testImageUrlParsing(url);
});

console.log('✅ URL parsing tests completed!');
