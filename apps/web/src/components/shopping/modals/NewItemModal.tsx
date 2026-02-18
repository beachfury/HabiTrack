// apps/web/src/components/shopping/modals/NewItemModal.tsx
import { useState, useRef, useEffect } from 'react';
import { X, Camera, RefreshCw, DollarSign, Trash2 } from 'lucide-react';
import { shoppingApi } from '../../../api';
import type { ShoppingCategory, ShoppingStore, CatalogItem } from '../../../types';
import { ModalPortal, ModalBody } from '../../common/ModalPortal';

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
    prices?: Array<{ storeId: number; price: number }>;
  }) => void;
  isAdmin: boolean;
  // NEW: Optional editItem prop for edit mode
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
  const [prices, setPrices] = useState<Array<{ storeId: number; price: string }>>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const result = await shoppingApi.uploadImage(reader.result as string, file.type);
        setImageUrl(result.imageKey);
      } catch (err) {
        alert('Failed to upload image');
      }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const addPriceEntry = () => {
    if (stores.length === 0) return;
    const usedStores = new Set(prices.map((p) => p.storeId));
    const availableStore = stores.find((s) => !usedStores.has(s.id));
    if (availableStore) {
      setPrices([...prices, { storeId: availableStore.id, price: '' }]);
    }
  };

  const updatePrice = (index: number, field: 'storeId' | 'price', value: any) => {
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
          .map((p) => ({ storeId: p.storeId, price: parseFloat(p.price) })),
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

  // Dynamic button text based on mode
  const getButtonText = () => {
    if (submitting) return 'Saving...';
    if (isEditMode) return 'Save Changes';
    if (isAdmin) return 'Create Item';
    return 'Submit Request';
  };

  const footer = (
    <button
      onClick={handleSubmit}
      disabled={!name.trim() || submitting}
      className="w-full py-3 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
    >
      {getButtonText()}
    </button>
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

          {/* Image */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Photo
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
              placeholder="e.g., Cheerios"
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)]"
              required
            />
          </div>

          {/* Brand */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Brand
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
              placeholder="e.g., 18 oz"
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

          {/* Prices (Admin only) */}
          {isAdmin && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-[var(--color-foreground)]">
                  Store Prices
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
                <div key={i} className="flex gap-2 mb-2">
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
                  <div className="relative w-24">
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
                    className="p-2 text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {prices.length === 0 && (
                <p className="text-sm text-[var(--color-muted-foreground)] italic">
                  No prices yet. Click "+ Add Store" to add.
                </p>
              )}
            </div>
          )}
        </div>
      </ModalBody>
    </ModalPortal>
  );
}
