'use client';

import { testImageUrlParsing } from '@/services/productsService';

export default function TestStoragePage() {
  const handleTestUrlParsing = () => {
    // Test with a sample Supabase Storage URL
    testImageUrlParsing('https://example.supabase.co/storage/v1/object/public/images/products/sample-product.jpg');
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Storage Test Page</h1>
      
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">URL Parsing Test</h2>
          <p className="text-gray-600 mb-4">
            Test the URL parsing logic for Supabase Storage image paths.
          </p>
          <button
            onClick={handleTestUrlParsing}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Test URL Parsing
          </button>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Image Deletion Status</h2>
          <p className="text-gray-600">
            The image deletion functions have been fixed to properly extract full paths 
            including the &apos;products/&apos; folder prefix from Supabase Storage URLs.
          </p>
          <ul className="list-disc list-inside mt-2 text-sm text-gray-600">
            <li>Fixed deleteProductImage() function</li>
            <li>Fixed deleteProductImageDirect() function</li>
            <li>Enhanced error handling and logging</li>
            <li>Added path validation</li>
          </ul>
        </div>
      </div>
    </div>
  );
}