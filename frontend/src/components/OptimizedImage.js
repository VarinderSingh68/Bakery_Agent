import React, { useState } from 'react';

export const OptimizedImage = ({ 
  src, 
  alt, 
  className = '',
  width,
  height,
  loading = 'lazy',
  onLoad,
  ...props 
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const getWebPUrl = (url) => {
    if (url.includes('unsplash.com')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}fm=webp&q=75`;
    }
    
    if (url.includes('pexels.com')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}auto=compress&cs=tinysrgb&fm=webp`;
    }
    
    return url;
  };

  const webpUrl = getWebPUrl(src);
  const isExternalImage = src.includes('http');

  const handleLoad = (e) => {
    setImageLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleError = () => {
    setHasError(true);
  };

  return (
    <picture>
      {isExternalImage && !hasError && (
        <source srcSet={webpUrl} type="image/webp" />
      )}
      
      <img
        src={hasError ? '/images/placeholder.jpg' : src}
        alt={alt}
        className={`${className} ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
        loading={loading}
        width={width}
        height={height}
        onLoad={handleLoad}
        onError={handleError}
        data-loaded={imageLoaded}
        {...props}
      />
    </picture>
  );
};

export default OptimizedImage;
