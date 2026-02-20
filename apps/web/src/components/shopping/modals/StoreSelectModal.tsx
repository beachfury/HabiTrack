// apps/web/src/components/shopping/modals/StoreSelectModal.tsx
import { useState, useEffect } from 'react';
import { Store, RefreshCw } from 'lucide-react';
import { ItemImage } from '../ItemImage';
import { shoppingApi } from '../../../api';
import type { CatalogItem, CatalogItemPrice, ShoppingStore, ListType } from '../../../types';
import { ModalPortal, ModalBody } from '../../common/ModalPortal';
import { ModalFooterButtons } from '../../common/ModalFooterButtons';

interface StoreSelectModalProps {
  item: CatalogItem;
  stores: ShoppingStore[];
  onClose: () => void;
  onAdd: (data: {
    catalogItemId: number;
    storeId: number | null;
    listType: ListType;
    quantity: number;
  }) => void;
  isAdmin: boolean;
}

export function StoreSelectModal({ item, stores, onClose, onAdd, isAdmin }: StoreSelectModalProps) {
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [listType, setListType] = useState<ListType>('need');
  const [quantity, setQuantity] = useState(1);
  const [itemPrices, setItemPrices] = useState<CatalogItemPrice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrices();
  }, [item.id]);

  const loadPrices = async () => {
    try {
      const data = await shoppingApi.getCatalogItemPrices(item.id);
      setItemPrices(data.prices || []);
      // Auto-select first store with a price, or first store overall
      if (data.prices?.length > 0) {
        setSelectedStoreId(data.prices[0].storeId);
      } else if (stores.length > 0) {
        setSelectedStoreId(stores[0].id);
      }
    } catch (err) {
      console.error('Failed to load prices', err);
      // If prices fail to load, still select first store
      if (stores.length > 0) {
        setSelectedStoreId(stores[0].id);
      }
    }
    setLoading(false);
  };

  // Get price for a store (if exists)
  const getPriceForStore = (storeId: number) => {
    return itemPrices.find((p) => p.storeId === storeId);
  };

  const selectedPrice = selectedStoreId ? getPriceForStore(selectedStoreId) : null;
  const totalPrice = selectedPrice ? Number(selectedPrice.price) * quantity : 0;

  const footer = (
    <ModalFooterButtons
      onCancel={onClose}
      onSubmit={() =>
        onAdd({
          catalogItemId: item.id,
          storeId: selectedStoreId,
          listType,
          quantity,
        })
      }
      submitText="Add to List"
      hideCancel
    />
  );

  return (
    <ModalPortal
      isOpen={true}
      onClose={onClose}
      title="Add to Shopping List"
      size="md"
      footer={footer}
    >
      <ModalBody>
        <div className="space-y-4">
          {/* Item Info */}
          <div className="flex items-center gap-3 p-3 bg-[var(--color-muted)] rounded-xl">
            <ItemImage url={item.imageUrl} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-[var(--color-foreground)] truncate">{item.name}</p>
              {item.brand && <p className="text-sm text-[var(--color-muted-foreground)] truncate">{item.brand}</p>}
            </div>
          </div>

          {/* Store Selection */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
              Select Store
            </label>
            {loading ? (
              <div className="text-center py-4">
                <RefreshCw className="animate-spin mx-auto text-[var(--color-muted-foreground)]" size={24} />
              </div>
            ) : (
              <div className="space-y-2">
                {/* Show ALL stores, with price if available */}
                {stores.map((store) => {
                  const price = getPriceForStore(store.id);
                  return (
                    <label
                      key={store.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        selectedStoreId === store.id
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                          : 'border-[var(--color-border)] hover:bg-[var(--color-muted)]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="store"
                        checked={selectedStoreId === store.id}
                        onChange={() => setSelectedStoreId(store.id)}
                        className="accent-[var(--color-primary)]"
                      />
                      <Store size={18} className="text-[var(--color-muted-foreground)]" />
                      <span className="flex-1 text-[var(--color-foreground)]">{store.name}</span>
                      {price ? (
                        <span className="font-semibold text-[var(--color-success)]">
                          ${Number(price.price).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-sm text-[var(--color-muted-foreground)]">No price</span>
                      )}
                    </label>
                  );
                })}

                {/* Any Store option */}
                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    selectedStoreId === null
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                      : 'border-[var(--color-border)] hover:bg-[var(--color-muted)]'
                  }`}
                >
                  <input
                    type="radio"
                    name="store"
                    checked={selectedStoreId === null}
                    onChange={() => setSelectedStoreId(null)}
                    className="accent-[var(--color-primary)]"
                  />
                  <Store size={18} className="text-[var(--color-muted-foreground)]" />
                  <span className="flex-1 text-[var(--color-foreground)]">Any Store</span>
                </label>

                {stores.length === 0 && (
                  <p className="text-sm text-[var(--color-muted-foreground)] text-center py-2">
                    No stores added yet. Add stores in the Manage tab.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* List Type */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
              Type
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setListType('need')}
                className={`flex-1 py-2 rounded-xl font-medium transition-colors ${
                  listType === 'need'
                    ? 'bg-[var(--color-success)] text-[var(--color-success-foreground)]'
                    : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'
                }`}
              >
                Need
              </button>
              <button
                onClick={() => setListType('want')}
                className={`flex-1 py-2 rounded-xl font-medium transition-colors ${
                  listType === 'want'
                    ? 'bg-[var(--color-warning)] text-[var(--color-warning-foreground)]'
                    : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'
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
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-full bg-[var(--color-muted)] text-[var(--color-foreground)] flex items-center justify-center text-xl font-bold"
              >
                -
              </button>
              <span className="text-xl font-semibold text-[var(--color-foreground)] w-8 text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-full bg-[var(--color-muted)] text-[var(--color-foreground)] flex items-center justify-center text-xl font-bold"
              >
                +
              </button>
            </div>
          </div>

          {/* Total */}
          {totalPrice > 0 && (
            <div className="p-3 rounded-xl" style={{ backgroundColor: 'color-mix(in srgb, var(--color-success) 10%, transparent)' }}>
              <div className="flex justify-between items-center">
                <span className="text-[var(--color-muted-foreground)]">Estimated Total</span>
                <span className="text-xl font-bold text-[var(--color-success)]">${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      </ModalBody>
    </ModalPortal>
  );
}
