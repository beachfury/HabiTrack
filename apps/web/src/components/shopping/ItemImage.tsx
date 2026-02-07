// apps/web/src/components/shopping/ItemImage.tsx
import { Package } from 'lucide-react';

type ImageSize = 'sm' | 'md' | 'lg';

interface ItemImageProps {
  url: string | null;
  size?: ImageSize;
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

export function ItemImage({ url, size = 'md', alt = '', className = '' }: ItemImageProps) {
  if (url) {
    return (
      <img
        src={url}
        alt={alt}
        className={`${sizeClasses[size]} object-cover rounded-lg flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0 ${className}`}
    >
      <Package size={iconSizes[size]} className="text-gray-400" />
    </div>
  );
}
