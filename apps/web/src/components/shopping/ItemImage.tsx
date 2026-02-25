// apps/web/src/components/shopping/ItemImage.tsx
import { Package } from 'lucide-react';

type ImageSize = 'sm' | 'md' | 'lg';
type ImageFit = 'cover' | 'contain';

interface ItemImageProps {
  url: string | null;
  size?: ImageSize;
  fit?: ImageFit;
  alt?: string;
  className?: string;
}

const sizeClasses: Record<ImageSize, string> = {
  sm: 'w-10 h-10',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
};

const iconSizes: Record<ImageSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

export function ItemImage({ url, size = 'md', fit = 'cover', alt = '', className = '' }: ItemImageProps) {
  if (url) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-lg flex-shrink-0 overflow-hidden ${fit === 'contain' ? 'bg-white/10' : ''} ${className}`}
      >
        <img
          src={url}
          alt={alt}
          className={`w-full h-full ${fit === 'contain' ? 'object-contain p-1' : 'object-cover'}`}
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} bg-[var(--color-muted)] rounded-lg flex items-center justify-center flex-shrink-0 ${className}`}
    >
      <Package size={iconSizes[size]} className="text-[var(--color-muted-foreground)]" />
    </div>
  );
}

// Card-style image for catalog grid — fills card width with proper aspect ratio
interface CardImageProps {
  url: string | null;
  alt?: string;
  className?: string;
}

export function CardImage({ url, alt = '', className = '' }: CardImageProps) {
  if (url) {
    return (
      <div className={`w-full aspect-square rounded-lg overflow-hidden bg-white/10 ${className}`}>
        <img
          src={url}
          alt={alt}
          className="w-full h-full object-contain p-2"
        />
      </div>
    );
  }

  return (
    <div className={`w-full aspect-square rounded-lg bg-[var(--color-muted)] flex items-center justify-center ${className}`}>
      <Package size={32} className="text-[var(--color-muted-foreground)]" />
    </div>
  );
}
