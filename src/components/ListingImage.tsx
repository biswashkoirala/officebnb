import { useState } from 'react';
import { Building2 } from 'lucide-react';

interface ListingImageProps {
  src: string;
  alt: string;
  className?: string;
}

export default function ListingImage({ src, alt, className = '' }: ListingImageProps) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-brand-100 to-ink-100 text-brand-500 ${className}`}
      >
        <Building2 size={36} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setErrored(true)}
      className={className}
    />
  );
}
