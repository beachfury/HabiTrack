// apps/web/src/components/shopping/modals/EditListItemModal.tsx
import { useState, useEffect } from 'react';
import { Save, DollarSign } from 'lucide-react';
import { ModalPortal } from '../../common/ModalPortal';
import { shoppingApi } from '../../../api';
import type { ShoppingListItem, ShoppingStore } from '../../../types';

interface ItemPrice {
  storeId: number;
  storeName: string;
  price: number;
}

interface EditListItemModalProps {
  item: ShoppingListItem;
  stores: ShoppingStore[];
  onClose: () => void;
  onSave: (data: { listType: 'need' | 'want'; quantity: number; storeId: number | null }) => void;
}

export function EditListItemModal({ item, stores, onClose, onSave }: EditListItemModalProps) {
  const [listType, setListType] = useState<'need' | 'want'>(item.listType);
  const [quantity, setQuantity] = useState(item.quantity);
  const [storeId, setStoreId] = useState<number | null>(item.storeId);
  const [saving, setSaving] = useState(false);
  const [itemPrices, setItemPrices] = useState<ItemPrice[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [currentPrice, setCurrentPrice] = useState<number | null>(
    item.storePrice ? Number(item.storePrice) : null,
  );

  // Fetch prices for this item at all stores
  useEffect(() => {
    async function fetchPrices() {
      setLoadingPrices(true);
      try {
        const data = await shoppingApi.getCatalogItemPrices(item.catalogItemId);
        setItemPrices(data.prices || []);
      } catch (err) {
        console.error('Failed to fetch prices:', err);
      } finally {
        setLoadingPrices(false);
      }
    }
    fetchPrices();
  }, [item.catalogItemId]);

  // Update price when store changes
  const handleStoreChange = (newStoreId: number | null) => {
    setStoreId(newStoreId);

    // Find price for this store
    if (newStoreId) {
      const priceInfo = itemPrices.find((p) => p.storeId === newStoreId);
      // Convert to number in case it's a string from the API
      setCurrentPrice(priceInfo?.price ? Number(priceInfo.price) : null);
    } else {
      // No store selected - use lowest price
      const lowestPrice = item.lowestPrice ? Number(item.lowestPrice) : null;
      setCurrentPrice(lowestPrice);
    }
  };

  // Get price for a store (for dropdown display)
  const getStorePrice = (sid: number): number | null => {
    const priceInfo = itemPrices.find((p) => p.storeId === sid);
    if (!priceInfo?.price) return null;
    // Convert to number in case it's a string from the API
    return Number(priceInfo.price);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ listType, quantity, storeId });
      onClose();
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };

  const totalPrice = currentPrice ? currentPrice * quantity : null;

  return (
    <ModalPortal isOpen={true} onClose={onClose} title="Edit List Item" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Item Info (read-only) */}
        <div className="p-3 bg-[var(--color-muted)] rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-[var(--color-foreground)]">{item.itemName}</p>
              {item.brand && (
                <p className="text-sm text-[var(--color-muted-foreground)]">{item.brand}</p>
              )}
            </div>
            {totalPrice !== null && (
              <div className="text-right">
                <p className="text-lg font-bold text-[var(--color-success)]">
                  ${totalPrice.toFixed(2)}
                </p>
                {quantity > 1 && currentPrice && (
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    ${currentPrice.toFixed(2)} each
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* List Type */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
            List Type
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setListType('need')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                listType === 'need'
                  ? 'bg-[var(--color-success)] text-white'
                  : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]/80'
              }`}
            >
              Need
            </button>
            <button
              type="button"
              onClick={() => setListType('want')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                listType === 'want'
                  ? 'bg-[var(--color-warning)] text-white'
                  : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]/80'
              }`}
            >
              Want
            </button>
          </div>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
            Quantity
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 rounded-lg bg-[var(--color-muted)] text-[var(--color-foreground)] text-lg font-bold hover:bg-[var(--color-muted)]/80"
            >
              −
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20 text-center py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-card)] text-[var(--color-foreground)]"
              min={1}
            />
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 rounded-lg bg-[var(--color-muted)] text-[var(--color-foreground)] text-lg font-bold hover:bg-[var(--color-muted)]/80"
            >
              +
            </button>
          </div>
        </div>

        {/* Store Selection with Prices */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
            Store
          </label>
          {loadingPrices ? (
            <div className="text-sm text-[var(--color-muted-foreground)] py-2">
              Loading prices...
            </div>
          ) : (
            <div className="space-y-1">
              {/* Any Store option */}
              <button
                type="button"
                onClick={() => handleStoreChange(null)}
                className={`w-full p-3 rounded-lg text-left transition-colors flex justify-between items-center ${
                  storeId === null
                    ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                    : 'bg-[var(--color-muted)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]/80'
                }`}
              >
                <span>Any Store</span>
                {item.lowestPrice && (
                  <span
                    className={`text-sm flex items-center gap-1 ${
                      storeId === null
                        ? 'text-[var(--color-primary-foreground)]'
                        : 'text-[var(--color-success)]'
                    }`}
                  >
                    <DollarSign size={14} />
                    {Number(item.lowestPrice).toFixed(2)}
                    <span className="text-xs opacity-70">(best)</span>
                  </span>
                )}
              </button>

              {/* Store options with prices */}
              {stores.map((store) => {
                const storePrice = getStorePrice(store.id);
                const isSelected = storeId === store.id;

                return (
                  <button
                    key={store.id}
                    type="button"
                    onClick={() => handleStoreChange(store.id)}
                    className={`w-full p-3 rounded-lg text-left transition-colors flex justify-between items-center ${
                      isSelected
                        ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                        : 'bg-[var(--color-muted)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]/80'
                    }`}
                  >
                    <span>{store.name}</span>
                    {storePrice !== null ? (
                      <span
                        className={`text-sm flex items-center gap-1 ${
                          isSelected
                            ? 'text-[var(--color-primary-foreground)]'
                            : 'text-[var(--color-success)]'
                        }`}
                      >
                        <DollarSign size={14} />
                        {storePrice.toFixed(2)}
                      </span>
                    ) : (
                      <span
                        className={`text-xs ${
                          isSelected
                            ? 'text-[var(--color-primary-foreground)]/70'
                            : 'text-[var(--color-muted-foreground)]'
                        }`}
                      >
                        No price
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-[var(--color-border)] rounded-lg text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-4 py-2 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </ModalPortal>
  );
}
