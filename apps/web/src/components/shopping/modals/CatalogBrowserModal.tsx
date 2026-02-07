// apps/web/src/components/shopping/modals/CatalogBrowserModal.tsx
import { useState } from 'react';
import { X, Plus, Search, Package } from 'lucide-react';
import { ItemImage } from '../ItemImage';
import type { CatalogItem, ShoppingCategory, ShoppingStore } from '../../../types';

interface CatalogBrowserModalProps {
  title: string;
  catalogItems: CatalogItem[];
  categories: ShoppingCategory[];
  stores: ShoppingStore[];
  onClose: () => void;
  onSelectItem: (item: CatalogItem) => void;
  onAddNewItem: () => void;
  onSearch: (term: string) => void;
  isAdmin: boolean;
  isRequestMode?: boolean;
}

export function CatalogBrowserModal({
  title,
  catalogItems,
  categories,
  stores,
  onClose,
  onSelectItem,
  onAddNewItem,
  onSearch,
  isAdmin,
  isRequestMode = false,
}: CatalogBrowserModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const filteredItems = catalogItems.filter((i) => {
    const matchesSearch =
      !searchTerm ||
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.brand && i.brand.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || i.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 w-full sm:max-w-lg sm:rounded-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-t-2xl">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          {/* Add New Item Button */}
          <button
            onClick={onAddNewItem}
            className="w-full mb-3 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 hover:border-orange-500 hover:text-orange-500 transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={18} /> {isAdmin ? 'Add New Item to Catalog' : 'Request New Item'}
          </button>

          {/* Search */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  onSearch(e.target.value);
                }}
                placeholder="Search catalog..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800"
                autoFocus
              />
            </div>
            <select
              value={selectedCategory || ''}
              onChange={(e) =>
                setSelectedCategory(e.target.value ? Number(e.target.value) : null)
              }
              className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm"
            >
              <option value="">All</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <Package size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 mb-3">No items found</p>
              <button onClick={onAddNewItem} className="text-orange-600 font-medium">
                + Add new item
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {filteredItems.slice(0, 20).map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-left hover:ring-2 hover:ring-orange-500 transition-all"
                >
                  <ItemImage url={item.imageUrl} />
                  <p className="font-medium text-gray-900 dark:text-white mt-2 truncate text-sm">
                    {item.name}
                  </p>
                  {item.brand && (
                    <p className="text-xs text-gray-500 truncate">{item.brand}</p>
                  )}
                  {item.lowestPrice && (
                    <p className="text-sm text-green-600 font-medium mt-1">
                      ${Number(item.lowestPrice).toFixed(2)}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
