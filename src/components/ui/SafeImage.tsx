'use client';

import { useState } from 'react';
import Image, { ImageProps } from 'next/image';

interface SafeImageProps extends Omit<ImageProps, 'onError'> {
  fallbackSrc?: string;
}

const SafeImage = ({ 
  src, 
  alt, 
  fallbackSrc = "https://via.placeholder.com/400x300?text=Image+Not+Found", 
  ...props 
}: SafeImageProps) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasErrored, setHasErrored] = useState(false);

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      onError={() => {
        if (!hasErrored) {
          setImgSrc(fallbackSrc);
          setHasErrored(true);
        }
      }}
    />
  );
};

export default SafeImage;