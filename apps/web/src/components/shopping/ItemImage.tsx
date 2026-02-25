// apps/web/src/components/shopping/ItemImage.tsx
import { useState } from 'react';
import { Package, X } from 'lucide-react';
import { createPortal } from 'react-dom';

type ImageSize = 'sm' | 'md' | 'lg' | 'xl';
type ImageFit = 'cover' | 'contain';

interface ItemImageProps {
  url: string | null;
  size?: ImageSize;
  fit?: ImageFit;
  alt?: string;
  className?: string;
  /** When true, clicking the image opens a full-size lightbox */
  expandable?: boolean;
}

const sizeClasses: Record<ImageSize, string> = {
  sm: 'w-10 h-10',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-20 h-20',
};

const iconSizes: Record<ImageSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

function ImageLightbox({ url, alt, onClose }: { url: string; alt: string; onClose: () => void }) {
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
      >
        <X size={24} />
      </button>
      <img
        src={url}
        alt={alt}
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body,
  );
}

export function ItemImage({ url, size = 'md', fit = 'cover', alt = '', className = '', expandable = false }: ItemImageProps) {
  const [showLightbox, setShowLightbox] = useState(false);

  const canExpand = expandable && !!url;

  if (url) {
    return (
      <>
        <div
          className={`${sizeClasses[size]} rounded-lg flex-shrink-0 overflow-hidden ${fit === 'contain' ? 'bg-white/10' : ''} ${canExpand ? 'cursor-pointer active:scale-95 transition-transform' : ''} ${className}`}
          onClick={canExpand ? () => setShowLightbox(true) : undefined}
        >
          <img
            src={url}
            alt={alt}
            className={`w-full h-full ${fit === 'contain' ? 'object-contain p-1' : 'object-cover'}`}
          />
        </div>
        {showLightbox && (
          <ImageLightbox url={url} alt={alt} onClose={() => setShowLightbox(false)} />
        )}
      </>
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
