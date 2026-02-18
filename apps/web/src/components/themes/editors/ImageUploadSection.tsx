// apps/web/src/components/themes/editors/ImageUploadSection.tsx
// Image upload section for background images — file upload + library browse

import { useState, useRef } from 'react';
import { X, Upload } from 'lucide-react';
import { ModalPortal, ModalBody } from '../../common/ModalPortal';
import { resolveImageUrl } from '../ElementStyleEditor';
import { MediaLibraryModal } from './MediaLibraryModal';

// Predefined categories for upload
const UPLOAD_CATEGORIES = [
  { id: '', label: 'No Category' },
  { id: 'sidebar', label: 'Sidebar' },
  { id: 'page-background', label: 'Page Background' },
  { id: 'card-background', label: 'Card Background' },
  { id: 'header', label: 'Header' },
  { id: 'cyberpunk', label: 'Cyberpunk' },
  { id: 'modern', label: 'Modern' },
  { id: 'nature', label: 'Nature' },
  { id: 'abstract', label: 'Abstract' },
  { id: 'fun', label: 'Fun' },
  { id: 'minimal', label: 'Minimal' },
];

export function ImageUploadSection({
  value,
  onChange,
}: {
  value?: string;
  onChange: (url: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('');
  const [uploadName, setUploadName] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Use JPEG, PNG, WebP, or GIF.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Max 5MB.');
      return;
    }

    // Store the file and show category/name form
    setPendingFile(file);
    setUploadName(file.name.replace(/\.[^/.]+$/, '')); // Default name from filename
    setShowUploadForm(true);
    setError(null);
  };

  const handleFileUpload = async () => {
    if (!pendingFile) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', pendingFile);
      formData.append('preset', 'background');
      if (uploadCategory) {
        formData.append('category', uploadCategory);
      }
      if (uploadName) {
        formData.append('name', uploadName);
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
      onChange(data.image.url);
      setShowUploadForm(false);
      setPendingFile(null);
      setUploadCategory('');
      setUploadName('');
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const cancelUpload = () => {
    setPendingFile(null);
    setShowUploadForm(false);
    setUploadCategory('');
    setUploadName('');
    setError(null);
  };

  return (
    <div className="space-y-3">
      {/* Upload Form Modal */}
      {showUploadForm && pendingFile && (
        <ModalPortal
          isOpen={true}
          onClose={cancelUpload}
          title="Upload Image"
          size="md"
          footer={
            <div className="flex gap-2">
              <button
                onClick={cancelUpload}
                disabled={uploading}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFileUpload}
                disabled={uploading}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Uploading...
                  </>
                ) : (
                  'Upload'
                )}
              </button>
            </div>
          }
        >
          <ModalBody>
            {/* Preview */}
            <div className="mb-4">
              <img
                src={URL.createObjectURL(pendingFile)}
                alt="Preview"
                className="w-full h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
              />
            </div>

            {/* Name input */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name (optional)
              </label>
              <input
                type="text"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                placeholder="Enter a descriptive name"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Category select */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {UPLOAD_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Categories help organize images in the library
              </p>
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}
          </ModalBody>
        </ModalPortal>
      )}

      {/* Action buttons row */}
      <div className="flex gap-2">
        {/* Upload button */}
        <button
          onClick={() => !uploading && fileInputRef.current?.click()}
          disabled={uploading}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed transition-colors ${
            uploading
              ? 'border-gray-300 bg-gray-50 dark:bg-gray-700/50 cursor-not-allowed'
              : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400 dark:hover:border-emerald-500 cursor-pointer'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
              e.target.value = '';
            }}
            className="hidden"
            disabled={uploading}
          />

          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500" />
              <span className="text-xs text-gray-500">Uploading...</span>
            </>
          ) : (
            <>
              <Upload size={16} className="text-gray-400" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Upload New</span>
            </>
          )}
        </button>

        {/* Browse Library button */}
        <button
          onClick={() => setShowLibrary(true)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs text-gray-600 dark:text-gray-400">Browse Library</span>
        </button>
      </div>

      {/* URL input */}
      <div>
        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
          Or enter URL
        </label>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="https://example.com/image.jpg"
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      {/* Preview */}
      {value && (
        <div className="relative">
          <img
            src={resolveImageUrl(value)}
            alt="Background"
            className="w-full h-20 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <button
            onClick={() => onChange(null)}
            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Error */}
      {error && !showUploadForm && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {/* Media Library Modal */}
      {showLibrary && (
        <MediaLibraryModal
          onSelect={(url) => onChange(url)}
          onClose={() => setShowLibrary(false)}
        />
      )}
    </div>
  );
}
