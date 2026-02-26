// apps/web/src/components/shopping/modals/NewItemModal.tsx
import { useState, useRef, useEffect } from 'react';
import { X, Camera, RefreshCw, DollarSign, Trash2, ImagePlus } from 'lucide-react';
import { shoppingApi } from '../../../api';
import type { ShoppingCategory, ShoppingStore, CatalogItem } from '../../../types';
import { resizeShoppingImage } from '../../../utils/cropImage';
import { ModalPortal, ModalBody } from '../../common/ModalPortal';
import { ModalFooterButtons } from '../../common/ModalFooterButtons';

interface StorePriceEntry {
  storeId: number;
  price: string;
  brand: string;
  imageUrl: string;
}

interface NewItemModalProps {
  categories: ShoppingCategory[];
  stores: ShoppingStore[];
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    brand?: string;
    sizeText?: string;
    categoryId?: number;
    imageUrl?: string;
    prices?: Array<{ storeId: number; price: number; imageUrl?: string; brand?: string }>;
  }) => void;
  isAdmin: boolean;
  // Optional editItem prop for edit mode
  editItem?: CatalogItem | null;
}

export function NewItemModal({
  categories,
  stores,
  onClose,
  onSubmit,
  isAdmin,
  editItem,
}: NewItemModalProps) {
  // Determine if we're in edit mode
  const isEditMode = !!editItem;

  // Initialize state with editItem values if in edit mode
  const [name, setName] = useState(editItem?.name || '');
  const [brand, setBrand] = useState(editItem?.brand || '');
  const [sizeText, setSizeText] = useState(editItem?.sizeText || '');
  const [categoryId, setCategoryId] = useState<number | null>(editItem?.categoryId || null);
  const [imageUrl, setImageUrl] = useState(editItem?.imageUrl || '');
  const [prices, setPrices] = useState<StorePriceEntry[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadingStoreIndex, setUploadingStoreIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const storeFileInputRef = useRef<HTMLInputElement>(null);

  // Load existing prices when editing
  useEffect(() => {
    if (editItem?.id) {
      loadExistingPrices(editItem.id);
    }
  }, [editItem?.id]);

  const loadExistingPrices = async (itemId: number) => {
    try {
      const data = await shoppingApi.getCatalogItemPrices(itemId);
      if (data.prices && data.prices.length > 0) {
        setPrices(
          data.prices.map((p) => ({
            storeId: p.storeId,
            price: p.price?.toString() || '',
            brand: p.brand || '',
            imageUrl: p.imageUrl || '',
          })),
        );
      }
    } catch (err) {
      console.error('Failed to load prices:', err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be under 2MB');
      return;
    }
    setUploading(true);
    try {
      const resized = await resizeShoppingImage(file);
      const result = await shoppingApi.uploadImage(resized.dataUrl, resized.mimeType);
      setImageUrl(result.imageKey);
    } catch (err) {
      alert('Failed to upload image');
    }
    setUploading(false);
  };

  const handleStoreImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploadingStoreIndex === null) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be under 2MB');
      return;
    }
    const idx = uploadingStoreIndex;
    try {
      const resized = await resizeShoppingImage(file);
      const result = await shoppingApi.uploadImage(resized.dataUrl, resized.mimeType);
      updatePrice(idx, 'imageUrl', result.imageKey);
    } catch (err) {
      alert('Failed to upload image');
    }
    setUploadingStoreIndex(null);
  };

  const triggerStoreImageUpload = (index: number) => {
    setUploadingStoreIndex(index);
    // Small delay to ensure state is set before triggering click
    setTimeout(() => storeFileInputRef.current?.click(), 0);
  };

  const addPriceEntry = () => {
    if (stores.length === 0) return;
    const usedStores = new Set(prices.map((p) => p.storeId));
    const availableStore = stores.find((s) => !usedStores.has(s.id));
    if (availableStore) {
      setPrices([...prices, { storeId: availableStore.id, price: '', brand: '', imageUrl: '' }]);
    }
  };

  const updatePrice = (index: number, field: keyof StorePriceEntry, value: any) => {
    const newPrices = [...prices];
    newPrices[index] = { ...newPrices[index], [field]: value };
    setPrices(newPrices);
  };

  const removePrice = (index: number) => {
    setPrices(prices.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert('Item name is required');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        brand: brand || undefined,
        sizeText: sizeText || undefined,
        categoryId: categoryId || undefined,
        imageUrl: imageUrl || undefined,
        prices: prices
          .filter((p) => p.price && parseFloat(p.price) > 0)
          .map((p) => ({
            storeId: p.storeId,
            price: parseFloat(p.price),
            imageUrl: p.imageUrl || undefined,
            brand: p.brand || undefined,
          })),
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Dynamic title based on mode
  const getTitle = () => {
    if (isEditMode) return 'Edit Item';
    if (isAdmin) return 'Add New Item';
    return 'Request New Item';
  };

  const footer = (
    <ModalFooterButtons
      onCancel={onClose}
      onSubmit={handleSubmit}
      submitText={isEditMode ? 'Save Changes' : isAdmin ? 'Create Item' : 'Submit Request'}
      submitting={submitting}
      submitDisabled={!name.trim()}
      hideCancel
    />
  );

  return (
    <ModalPortal
      isOpen={true}
      onClose={onClose}
      title={getTitle()}
      size="lg"
      footer={footer}
    >
      <ModalBody>
        <div className="space-y-4">
          {!isAdmin && !isEditMode && (
            <div className="p-3 rounded-xl text-sm" style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)', color: 'var(--color-primary)' }}>
              Your request will be sent to an admin for approval.
            </div>
          )}

          {/* Default Image */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Default Photo
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            {imageUrl ? (
              <div className="relative">
                <img src={imageUrl} alt="" className="w-full h-32 object-cover rounded-xl" />
                <button
                  onClick={() => setImageUrl('')}
                  className="absolute top-2 right-2 p-1 bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)] rounded-full"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full h-24 border-2 border-dashed border-[var(--color-border)] rounded-xl flex flex-col items-center justify-center gap-2 hover:border-[var(--color-primary)] transition-colors"
              >
                {uploading ? (
                  <RefreshCw size={24} className="animate-spin text-[var(--color-muted-foreground)]" />
                ) : (
                  <>
                    <Camera size={24} className="text-[var(--color-muted-foreground)]" />
                    <span className="text-sm text-[var(--color-muted-foreground)]">Upload photo</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., 2% Milk"
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)]"
              required
            />
          </div>

          {/* Default Brand */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Default Brand
            </label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g., General Mills"
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)]"
            />
          </div>

          {/* Size */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Size/Package
            </label>
            <input
              type="text"
              value={sizeText}
              onChange={(e) => setSizeText(e.target.value)}
              placeholder="e.g., 1 gallon"
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)]"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Category
            </label>
            <select
              value={categoryId || ''}
              onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)]"
            >
              <option value="">Select category...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Store Prices with per-store brand & image (Admin only) */}
          {isAdmin && (
            <div>
              {/* Hidden file input for store-specific image uploads */}
              <input
                ref={storeFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleStoreImageUpload}
                className="hidden"
              />

              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-[var(--color-foreground)]">
                  Store Prices & Brands
                </label>
                <button
                  onClick={addPriceEntry}
                  disabled={prices.length >= stores.length}
                  className="text-sm text-[var(--color-primary)] hover:opacity-80 disabled:opacity-50"
                >
                  + Add Store
                </button>
              </div>
              {prices.map((p, i) => (
                <div key={i} className="mb-3 p-3 bg-[var(--color-muted)] rounded-xl space-y-2">
                  {/* Row 1: Store select + Price + Delete */}
                  <div className="flex gap-2 items-center">
                    <select
                      value={p.storeId}
                      onChange={(e) => updatePrice(i, 'storeId', Number(e.target.value))}
                      className="flex-1 px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)] text-sm"
                    >
                      {stores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <div className="relative w-20 sm:w-24">
                      <DollarSign
                        size={16}
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]"
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={p.price}
                        onChange={(e) => updatePrice(i, 'price', e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-7 pr-2 py-2 border border-[var(--color-border)] rounded-xl text-sm bg-[var(--color-card)] text-[var(--color-foreground)]"
                      />
                    </div>
                    <button
                      onClick={() => removePrice(i)}
                      className="p-2 text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 rounded-lg flex-shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {/* Row 2: Store-specific brand + image */}
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={p.brand}
                      onChange={(e) => updatePrice(i, 'brand', e.target.value)}
                      placeholder="Store brand (optional)"
                      className="flex-1 px-3 py-1.5 border border-[var(--color-border)] rounded-lg bg-[var(--color-card)] text-[var(--color-foreground)] text-sm"
                    />
                    {p.imageUrl ? (
                      <div className="relative flex-shrink-0">
                        <img
                          src={p.imageUrl}
                          alt=""
                          className="w-9 h-9 rounded-lg object-cover border border-[var(--color-border)]"
                        />
                        <button
                          onClick={() => updatePrice(i, 'imageUrl', '')}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)] rounded-full flex items-center justify-center"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => triggerStoreImageUpload(i)}
                        disabled={uploadingStoreIndex === i}
                        className="p-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-lg flex-shrink-0"
                        title="Upload store-specific image"
                      >
                        {uploadingStoreIndex === i ? (
                          <RefreshCw size={16} className="animate-spin" />
                        ) : (
                          <ImagePlus size={16} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {prices.length === 0 && (
                <p className="text-sm text-[var(--color-muted-foreground)] italic">
                  No store prices yet. Click "+ Add Store" to add pricing and store-specific brands.
                </p>
              )}
            </div>
          )}
        </div>
      </ModalBody>
    </ModalPortal>
  );
}
