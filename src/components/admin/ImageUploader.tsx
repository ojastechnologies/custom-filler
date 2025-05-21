'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

interface ImageUploaderProps {
  currentImage: string;
  onImageSelected: (imageUrl: string, file: File) => void;
}

const ImageUploader = ({ currentImage, onImageSelected }: ImageUploaderProps) => {
  const [previewUrl, setPreviewUrl] = useState<string>(currentImage || '');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, etc.)');
      return;
    }

    // Validate file size (limit to 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size should be less than 2MB');
      return;
    }

    setError(null);
    
    // Create a preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    
    // Pass the file and URL to parent component
    onImageSelected(objectUrl, file);

    // Clean up the object URL when component unmounts
    return () => URL.revokeObjectURL(objectUrl);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        
        <button
          type="button"
          onClick={triggerFileInput}
          disabled={isUploading}
          className="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md text-sm font-medium transition-colors"
        >
          {isUploading ? 'Uploading...' : 'Choose Image'}
        </button>
        
        {previewUrl && (
          <button
            type="button"
            onClick={() => {
              setPreviewUrl('');
              onImageSelected('', null as unknown as File);
            }}
            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
          >
            Remove
          </button>
        )}
      </div>
      
      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
      )}
      
      {previewUrl && (
        <div className="relative h-40 w-40 border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
          <Image
            src={previewUrl}
            alt="Product image preview"
            fill
            className="object-contain"
            onError={() => {
              setError('Error loading image preview');
              setPreviewUrl('/placeholder-product.jpg');
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ImageUploader;