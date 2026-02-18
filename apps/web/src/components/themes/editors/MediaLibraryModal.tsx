// apps/web/src/components/themes/editors/MediaLibraryModal.tsx
// Media Library Modal for browsing uploaded images

import { useState, useEffect } from 'react';
import { ModalPortal, ModalBody } from '../../common/ModalPortal';
import { resolveImageUrl } from '../ElementStyleEditor';

// Image library asset type
interface LibraryAsset {
  id: string;
  url: string;
  filename: string;
  width: number;
  height: number;
  sizeBytes: number;
  assetType: string;
  category?: string | null;
  name?: string | null;
  createdAt: string;
  uploaderName?: string | null;
}

// Category type from API
interface CategoryInfo {
  id: string;
  label: string;
  description: string;
}

export function MediaLibraryModal({
  onSelect,
  onClose,
}: {
  onSelect: (url: string) => void;
  onClose: () => void;
}) {
  const [assets, setAssets] = useState<LibraryAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/uploads/categories', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setCategories(data.predefinedCategories || []);
          const counts: Record<string, number> = {};
          (data.categories || []).forEach((c: { id: string; count: number }) => {
            counts[c.id] = c.count;
          });
          setCategoryCounts(counts);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    loadCategories();
  }, []);

  // Load assets when category changes
  useEffect(() => {
    const loadAssets = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: '100' });
        if (selectedCategory !== 'all') {
          params.set('category', selectedCategory);
        }
        const response = await fetch(`/api/uploads/theme-library?${params}`, {
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to load library');
        const data = await response.json();
        setAssets(data.assets || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load library');
      } finally {
        setLoading(false);
      }
    };
    loadAssets();
  }, [selectedCategory]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Build category tabs - show "All" + predefined categories that have images + uncategorized if any
  const categoryTabs = [
    { id: 'all', label: 'All', count: Object.values(categoryCounts).reduce((a, b) => a + b, 0) },
    ...categories
      .filter(c => categoryCounts[c.id] > 0)
      .map(c => ({ id: c.id, label: c.label, count: categoryCounts[c.id] || 0 })),
  ];

  // Add uncategorized if there are any
  if (categoryCounts['uncategorized'] > 0) {
    categoryTabs.push({ id: 'uncategorized', label: 'Uncategorized', count: categoryCounts['uncategorized'] });
  }

  return (
    <ModalPortal
      isOpen={true}
      onClose={onClose}
      title="Image Library"
      size="xl"
    >
      <ModalBody>
        {/* Category tabs */}
        {categoryTabs.length > 1 && (
          <div className="flex flex-wrap gap-1 pb-3 mb-4 border-b border-gray-200 dark:border-gray-700">
            {categoryTabs.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {cat.label}
                {cat.count > 0 && (
                  <span className="ml-1 text-[10px] opacity-70">({cat.count})</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="max-h-[50vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">{error}</div>
          ) : assets.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p className="mb-2">No images in {selectedCategory === 'all' ? 'library' : `"${selectedCategory}" category`} yet.</p>
              <p className="text-sm">Upload an image to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => {
                    onSelect(asset.url);
                    onClose();
                  }}
                  className="group relative aspect-video rounded-lg overflow-hidden border-2 border-transparent hover:border-emerald-500 transition-colors focus:outline-none focus:border-emerald-500"
                >
                  <img
                    src={resolveImageUrl(asset.url)}
                    alt={asset.name || asset.filename}
                    className="w-full h-full object-cover"
                  />
                  {/* Category badge */}
                  {asset.category && (
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/50 text-white text-[9px] font-medium rounded">
                      {asset.category}
                    </span>
                  )}
                  {/* Hover overlay with info */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
                    {asset.name && (
                      <span className="text-white text-xs font-medium truncate max-w-full mb-1">
                        {asset.name}
                      </span>
                    )}
                    <span className="text-white text-xs truncate max-w-full">
                      {asset.width}×{asset.height}
                    </span>
                    <span className="text-white/70 text-xs">
                      {formatSize(asset.sizeBytes)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {assets.length} image{assets.length !== 1 ? 's' : ''} {selectedCategory !== 'all' && `in "${selectedCategory}"`}
          </p>
        </div>
      </ModalBody>
    </ModalPortal>
  );
}
