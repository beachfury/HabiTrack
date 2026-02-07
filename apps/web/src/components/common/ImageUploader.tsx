// apps/web/src/components/common/ImageUploader.tsx
// Component for uploading and managing theme images

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';

interface UploadedImage {
  id: string;
  url: string;
  filename: string;
  width: number;
  height: number;
  sizeBytes: number;
}

interface ImageUploaderProps {
  /**
   * Preset determines the output size:
   * - thumbnail: 400x300
   * - sidebar: 400x800
   * - background: 1920x1080
   * - background-pattern: 200x200
   */
  preset: 'thumbnail' | 'sidebar' | 'background' | 'background-pattern';
  /** Current image URL (if any) */
  value?: string;
  /** Called when image is uploaded or cleared */
  onChange: (url: string | null, imageData?: UploadedImage) => void;
  /** Optional theme ID to associate the upload with */
  themeId?: string;
  /** Label for the upload area */
  label?: string;
  /** Additional class names */
  className?: string;
  /** Whether to show a preview */
  showPreview?: boolean;
  /** Preview aspect ratio (width/height) */
  previewAspectRatio?: number;
}

const PRESET_LABELS: Record<string, string> = {
  thumbnail: 'Theme Thumbnail (400×300)',
  sidebar: 'Sidebar Image (400×800)',
  background: 'Background (1920×1080)',
  'background-pattern': 'Pattern Tile (200×200)',
};

export function ImageUploader({
  preset,
  value,
  onChange,
  themeId,
  label,
  className = '',
  showPreview = true,
  previewAspectRatio,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (file: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please use JPEG, PNG, WebP, or GIF.');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('preset', preset);
      if (themeId) {
        formData.append('themeId', themeId);
      }

      const response = await fetch('/api/uploads/theme-image', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await response.json();
      onChange(data.image.url, data.image);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [preset, themeId, onChange]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  }, [handleUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  }, [handleUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleClear = useCallback(() => {
    onChange(null);
    setError(null);
  }, [onChange]);

  // Calculate preview dimensions based on preset
  const getPreviewStyle = () => {
    if (previewAspectRatio) {
      return { paddingBottom: `${(1 / previewAspectRatio) * 100}%` };
    }

    switch (preset) {
      case 'thumbnail':
        return { paddingBottom: '75%' }; // 4:3
      case 'sidebar':
        return { paddingBottom: '200%' }; // 1:2
      case 'background':
        return { paddingBottom: '56.25%' }; // 16:9
      case 'background-pattern':
        return { paddingBottom: '100%' }; // 1:1
      default:
        return { paddingBottom: '75%' };
    }
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}

      {/* Current image preview */}
      {value && showPreview && (
        <div className="relative mb-3">
          <div
            className="relative w-full overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600"
            style={getPreviewStyle()}
          >
            <img
              src={value}
              alt="Uploaded"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
              title="Remove image"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Upload area */}
      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
          ${dragOver
            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
          }
          ${uploading ? 'cursor-wait' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="animate-spin text-purple-600" size={32} />
            <span className="text-sm text-gray-600 dark:text-gray-400">Uploading...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {value ? (
              <ImageIcon className="text-gray-400" size={32} />
            ) : (
              <Upload className="text-gray-400" size={32} />
            )}
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="text-purple-600 dark:text-purple-400 font-medium">
                Click to upload
              </span>{' '}
              or drag and drop
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {PRESET_LABELS[preset]} • JPEG, PNG, WebP, GIF up to 5MB
            </p>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-2 flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* URL input fallback */}
      <div className="mt-3">
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
          Or enter image URL
        </label>
        <input
          type="url"
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="https://example.com/image.jpg"
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400"
        />
      </div>
    </div>
  );
}
