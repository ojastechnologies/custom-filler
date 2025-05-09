'use client';

import Image from 'next/image';
import { ImageProps } from 'next/image';

export default function ClientImage(props: ImageProps) {
  return (
    <Image 
      {...props} 
      onError={(e) => {
        // Fallback if image doesn't exist
        const target = e.target as HTMLImageElement;
        target.src = "https://via.placeholder.com/400x300?text=" + (props.alt || '').replace(' ', '+');
      }}
    />
  );
}