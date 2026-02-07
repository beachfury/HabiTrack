// apps/web/src/components/shopping/modals/StoreSelectModal.tsx
import { useState, useEffect } from 'react';
import { X, Store, RefreshCw } from 'lucide-react';
import { ItemImage } from '../ItemImage';
import { shoppingApi } from '../../../api';
import type { CatalogItem, CatalogItemPrice, ShoppingStore, ListType } from '../../../types';

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 w-full sm:max-w-md sm:rounded-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-t-2xl">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Add to Shopping List
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Item Info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
            <ItemImage url={item.imageUrl} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
              {item.brand && <p className="text-sm text-gray-500 truncate">{item.brand}</p>}
            </div>
          </div>

          {/* Store Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Store
            </label>
            {loading ? (
              <div className="text-center py-4">
                <RefreshCw className="animate-spin mx-auto text-gray-400" size={24} />
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
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="store"
                        checked={selectedStoreId === store.id}
                        onChange={() => setSelectedStoreId(store.id)}
                        className="text-orange-500"
                      />
                      <Store size={18} className="text-gray-400" />
                      <span className="flex-1 text-gray-900 dark:text-white">{store.name}</span>
                      {price ? (
                        <span className="font-semibold text-green-600">
                          ${Number(price.price).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">No price</span>
                      )}
                    </label>
                  );
                })}

                {/* Any Store option */}
                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    selectedStoreId === null
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="store"
                    checked={selectedStoreId === null}
                    onChange={() => setSelectedStoreId(null)}
                    className="text-orange-500"
                  />
                  <Store size={18} className="text-gray-400" />
                  <span className="flex-1 text-gray-900 dark:text-white">Any Store</span>
                </label>

                {stores.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-2">
                    No stores added yet. Add stores in the Manage tab.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* List Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setListType('need')}
                className={`flex-1 py-2 rounded-xl font-medium transition-colors ${
                  listType === 'need'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                Need
              </button>
              <button
                onClick={() => setListType('want')}
                className={`flex-1 py-2 rounded-xl font-medium transition-colors ${
                  listType === 'want'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                Want
              </button>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quantity
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xl font-bold"
              >
                -
              </button>
              <span className="text-xl font-semibold text-gray-900 dark:text-white w-8 text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xl font-bold"
              >
                +
              </button>
            </div>
          </div>

          {/* Total */}
          {totalPrice > 0 && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-300">Estimated Total</span>
                <span className="text-xl font-bold text-green-600">${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
          <button
            onClick={() =>
              onAdd({
                catalogItemId: item.id,
                storeId: selectedStoreId,
                listType,
                quantity,
              })
            }
            className="w-full py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
          >
            Add to List
          </button>
        </div>
      </div>
    </div>
  );
}
