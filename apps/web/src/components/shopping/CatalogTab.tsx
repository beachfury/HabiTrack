// apps/web/src/components/shopping/CatalogTab.tsx
import { useState } from 'react';
import { Plus, Search, Edit, Package, ChevronDown, ChevronRight } from 'lucide-react';
import { ItemImage } from './ItemImage';
import { NewItemModal } from './modals/NewItemModal';
import { shoppingApi } from '../../api';
import type { CatalogItem, ShoppingCategory, ShoppingStore } from '../../types';

interface CatalogTabProps {
  items: CatalogItem[];
  categories: ShoppingCategory[];
  stores: ShoppingStore[];
  searchTerm: string;
  onSearch: (term: string) => void;
  onAddToList: (item: CatalogItem) => void;
  onAddNewItem: () => void;
  onRequestItem: () => void;
  onRefresh: () => void;
  isAdmin: boolean;
  isKid: boolean;
}

export function CatalogTab({
  items,
  categories,
  stores,
  searchTerm,
  onSearch,
  onAddToList,
  onAddNewItem,
  onRequestItem,
  onRefresh,
  isAdmin,
  isKid,
}: CatalogTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<number | 'uncategorized'>>(
    new Set(),
  );
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);

  const filteredItems = selectedCategory
    ? items.filter((i) => i.categoryId === selectedCategory)
    : items;

  // Group by category
  const itemsByCategory: Record<string, CatalogItem[]> = {};
  filteredItems.forEach((item) => {
    const catName = item.categoryName || 'Other';
    if (!itemsByCategory[catName]) itemsByCategory[catName] = [];
    itemsByCategory[catName].push(item);
  });

  // Get category ID from name for expand/collapse
  const getCategoryId = (catName: string): number | 'uncategorized' => {
    if (catName === 'Other') return 'uncategorized';
    const cat = categories.find((c) => c.name === catName);
    return cat?.id || 'uncategorized';
  };

  const toggleCategory = (catName: string) => {
    const catId = getCategoryId(catName);
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });
  };

  const isCategoryExpanded = (catName: string) => {
    return expandedCategories.has(getCategoryId(catName));
  };

  // Handle saving edited item - uses same format as NewItemModal
  const handleSaveItem = async (data: {
    name: string;
    brand?: string;
    sizeText?: string;
    categoryId?: number;
    imageUrl?: string;
    prices?: Array<{ storeId: number; price: number }>;
  }) => {
    if (!editingItem) return;

    try {
      // Update item details
      await shoppingApi.updateCatalogItem(editingItem.id, {
        name: data.name,
        brand: data.brand,
        sizeText: data.sizeText,
        categoryId: data.categoryId,
        imageUrl: data.imageUrl,
      });

      // Update prices if provided
      if (data.prices && data.prices.length > 0) {
        for (const price of data.prices) {
          await shoppingApi.setCatalogItemPrice(editingItem.id, price.storeId, price.price);
        }
      }

      setEditingItem(null);
      onRefresh();
    } catch (err) {
      console.error('Failed to update item:', err);
    }
  };

  return (
    <div className="space-y-3">
      {/* Action Buttons */}
      <button
        onClick={isAdmin ? onAddNewItem : onRequestItem}
        className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-orange-500 hover:text-orange-500 transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={20} /> {isAdmin ? 'Add New Item' : 'Request New Item'}
      </button>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800"
          />
        </div>
        <select
          value={selectedCategory || ''}
          onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
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

      {/* Items - Collapsible by Category */}
      {Object.keys(itemsByCategory).length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
          <Package size={48} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">No items found</p>
        </div>
      ) : (
        Object.entries(itemsByCategory).map(([catName, catItems]) => {
          const isExpanded = isCategoryExpanded(catName);
          const category = categories.find((c) => c.name === catName);

          return (
            <div
              key={catName}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              {/* Category Header - Clickable to expand/collapse */}
              <button
                onClick={() => toggleCategory(catName)}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown size={20} className="text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
                )}
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: category?.color || '#f97316' }}
                />
                <span className="font-semibold text-gray-700 dark:text-gray-300">{catName}</span>
                <span className="text-sm text-gray-500">({catItems.length})</span>
              </button>

              {/* Category Items - Shown when expanded */}
              {isExpanded && (
                <div className="border-t border-gray-100 dark:border-gray-700 p-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {catItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 relative group"
                      >
                        <ItemImage url={item.imageUrl} size="lg" />
                        <p className="font-medium text-gray-900 dark:text-white mt-2 truncate text-sm">
                          {item.name}
                        </p>
                        {item.brand && (
                          <p className="text-xs text-gray-500 truncate">{item.brand}</p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          {item.lowestPrice ? (
                            <span className="text-sm text-green-600 font-medium">
                              ${Number(item.lowestPrice).toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">No price</span>
                          )}
                          <div className="flex gap-1">
                            <button
                              onClick={() => onAddToList(item)}
                              className="p-1.5 text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-lg"
                              title="Add to list"
                            >
                              <Plus size={16} />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => setEditingItem(item)}
                                className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg"
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Edit Item Modal - Uses NewItemModal with editItem prop */}
      {editingItem && (
        <NewItemModal
          categories={categories}
          stores={stores}
          onClose={() => setEditingItem(null)}
          onSubmit={handleSaveItem}
          isAdmin={isAdmin}
          editItem={editingItem}
        />
      )}
    </div>
  );
}
