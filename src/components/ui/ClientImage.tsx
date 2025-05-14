'use client';

import Image from 'next/image';
import { ImageProps } from 'next/image';
import { useState } from 'react';

export default function ClientImage(props: ImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(props.src as string);
  
  // Ensure alt prop is always present
  const altText = props.alt || '';
  
  return (
    <Image 
      {...props} 
      src={imgSrc}
      alt={altText} // Explicitly set alt prop
      onError={() => {
        // Fallback if image doesn't exist - removed unused target variable
        const fallbackSrc = `https://via.placeholder.com/400x300?text=${altText.replace(/ /g, '+')}`;
        setImgSrc(fallbackSrc);
      }}
    />
  );
}
