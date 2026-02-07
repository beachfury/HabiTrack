// apps/web/src/components/shopping/ManageTab.tsx
// Shopping Manage Tab - Categories, Stores, and Catalog Items management

import { useState, useEffect } from 'react';
import {
  Store,
  Tag,
  Check,
  X,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  Package,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { shoppingApi } from '../../api';
import { ColorPicker } from '../common/ColorPicker';
import { NewItemModal } from './modals/NewItemModal';
import type { ShoppingCategory, ShoppingStore, StoreRequest, CatalogItem } from '../../types';

type ManageSubTab = 'catalog' | 'categories' | 'stores';

interface ManageTabProps {
  categories: ShoppingCategory[];
  stores: ShoppingStore[];
  storeRequests: StoreRequest[];
  onApproveStore: (id: number) => void;
  onDenyStore: (id: number) => void;
  onAddCategory: (name: string, color?: string) => void;
  onAddStore: (name: string) => void;
  onRefresh: () => void;
}

export function ManageTab({
  categories,
  stores,
  storeRequests,
  onApproveStore,
  onDenyStore,
  onAddCategory,
  onAddStore,
  onRefresh,
}: ManageTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<ManageSubTab>('catalog');
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  // New Category Form
  const [newCategory, setNewCategory] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#f97316');

  // New Store Form
  const [newStore, setNewStore] = useState('');

  // Edit states
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<ShoppingCategory | null>(null);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'item' | 'category';
    id: number;
  } | null>(null);

  // Fetch catalog items
  useEffect(() => {
    if (activeSubTab === 'catalog') {
      fetchCatalogItems();
    }
  }, [activeSubTab]);

  const fetchCatalogItems = async () => {
    setLoading(true);
    try {
      const data = await shoppingApi.getCatalogItems();
      setCatalogItems(data.items);
    } catch (err) {
      console.error('Failed to fetch catalog items:', err);
    } finally {
      setLoading(false);
    }
  };

  // Group items by category
  const itemsByCategory = categories.reduce(
    (acc, cat) => {
      acc[cat.id] = catalogItems.filter((item) => item.categoryId === cat.id);
      return acc;
    },
    {} as Record<number, CatalogItem[]>,
  );

  // Uncategorized items
  const uncategorizedItems = catalogItems.filter((item) => !item.categoryId);

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      onAddCategory(newCategory.trim(), newCategoryColor);
      setNewCategory('');
      setNewCategoryColor('#f97316');
    }
  };

  const handleAddStore = () => {
    if (newStore.trim()) {
      onAddStore(newStore.trim());
      setNewStore('');
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    try {
      await shoppingApi.deleteCatalogItem(itemId);
      setCatalogItems((prev) => prev.filter((i) => i.id !== itemId));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    try {
      await shoppingApi.deleteCategory(categoryId);
      setDeleteConfirm(null);
      onRefresh();
    } catch (err) {
      console.error('Failed to delete category:', err);
    }
  };

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

  const handleSaveCategory = async (updates: { name?: string; color?: string }) => {
    if (!editingCategory) return;

    try {
      await shoppingApi.updateCategory(editingCategory.id, {
        name: updates.name,
        color: updates.color,
      });
      setEditingCategory(null);
      onRefresh();
    } catch (err) {
      console.error('Failed to update category:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Store Requests Alert */}
      {storeRequests.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={20} className="text-yellow-600" />
            <span className="font-medium text-yellow-800 dark:text-yellow-200">
              {storeRequests.length} pending store request{storeRequests.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-2">
            {storeRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-2"
              >
                <span className="text-gray-900 dark:text-white">{req.name}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => onApproveStore(req.id)}
                    className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg"
                  >
                    <Check size={18} />
                  </button>
                  <button
                    onClick={() => onDenyStore(req.id)}
                    className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveSubTab('catalog')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeSubTab === 'catalog'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Package size={18} className="inline mr-2" />
          Catalog Items
        </button>
        <button
          onClick={() => setActiveSubTab('categories')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeSubTab === 'categories'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Tag size={18} className="inline mr-2" />
          Categories
        </button>
        <button
          onClick={() => setActiveSubTab('stores')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeSubTab === 'stores'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Store size={18} className="inline mr-2" />
          Stores
        </button>
      </div>

      {/* Catalog Items Tab */}
      {activeSubTab === 'catalog' && (
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-orange-500" size={32} />
            </div>
          ) : (
            <>
              {/* Categories with items */}
              {categories.map((category) => {
                const items = itemsByCategory[category.id] || [];
                if (items.length === 0) return null;
                const isExpanded = expandedCategories.has(category.id);

                return (
                  <div
                    key={category.id}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
                  >
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      {isExpanded ? (
                        <ChevronDown size={20} className="text-gray-400" />
                      ) : (
                        <ChevronRight size={20} className="text-gray-400" />
                      )}
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color || '#f97316' }}
                      />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {category.name}
                      </span>
                      <span className="text-sm text-gray-500">({items.length})</span>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white truncate">
                                {item.name}
                              </p>
                              {item.brand && (
                                <p className="text-sm text-gray-500 truncate">{item.brand}</p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => setEditingItem(item)}
                                className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm({ type: 'item', id: item.id })}
                                className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Uncategorized items */}
              {uncategorizedItems.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <button
                    onClick={() => toggleCategory(0)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    {expandedCategories.has(0) ? (
                      <ChevronDown size={20} className="text-gray-400" />
                    ) : (
                      <ChevronRight size={20} className="text-gray-400" />
                    )}
                    <span className="w-3 h-3 rounded-full bg-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white">Uncategorized</span>
                    <span className="text-sm text-gray-500">({uncategorizedItems.length})</span>
                  </button>

                  {expandedCategories.has(0) && (
                    <div className="border-t border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                      {uncategorizedItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">
                              {item.name}
                            </p>
                            {item.brand && (
                              <p className="text-sm text-gray-500 truncate">{item.brand}</p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setEditingItem(item)}
                              className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ type: 'item', id: item.id })}
                              className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {catalogItems.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Package size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>No catalog items yet</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Categories Tab */}
      {activeSubTab === 'categories' && (
        <div className="space-y-3">
          {/* Add Category Form */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Plus size={18} className="text-orange-500" />
              Add Category
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Category name..."
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800"
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              />
              <ColorPicker color={newCategoryColor} onChange={setNewCategoryColor} label="Color" />
              <button
                onClick={handleAddCategory}
                disabled={!newCategory.trim()}
                className="w-full py-2 bg-orange-500 text-white rounded-xl font-medium disabled:opacity-50"
              >
                Add Category
              </button>
            </div>
          </div>

          {/* Category List */}
          <div className="space-y-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700"
              >
                <span
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: cat.color || '#f97316' }}
                />
                <span className="flex-1 font-medium text-gray-900 dark:text-white">{cat.name}</span>
                <button
                  onClick={() => setEditingCategory(cat)}
                  className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => setDeleteConfirm({ type: 'category', id: cat.id })}
                  className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stores Tab */}
      {activeSubTab === 'stores' && (
        <div className="space-y-3">
          {/* Add Store Form */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Plus size={18} className="text-orange-500" />
              Add Store
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newStore}
                onChange={(e) => setNewStore(e.target.value)}
                placeholder="Store name..."
                className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800"
                onKeyDown={(e) => e.key === 'Enter' && handleAddStore()}
              />
              <button
                onClick={handleAddStore}
                disabled={!newStore.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-xl font-medium disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>

          {/* Store List */}
          <div className="space-y-2">
            {stores.map((store) => (
              <div
                key={store.id}
                className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700"
              >
                <Store size={18} className="text-blue-500" />
                <span className="flex-1 font-medium text-gray-900 dark:text-white">
                  {store.name}
                </span>
                {store.isDefault && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    Default
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Item Modal - Uses NewItemModal */}
      {editingItem && (
        <NewItemModal
          categories={categories}
          stores={stores}
          onClose={() => setEditingItem(null)}
          onSubmit={handleSaveItem}
          isAdmin={true}
          editItem={editingItem}
        />
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <EditCategoryModal
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
          onSave={handleSaveCategory}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Confirm Delete
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete this {deleteConfirm.type}? This action cannot be
              undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm.type === 'item') {
                    handleDeleteItem(deleteConfirm.id);
                  } else {
                    handleDeleteCategory(deleteConfirm.id);
                  }
                }}
                className="flex-1 py-2 bg-red-500 text-white rounded-xl"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Edit Category Modal
// =============================================================================
interface EditCategoryModalProps {
  category: ShoppingCategory;
  onClose: () => void;
  onSave: (updates: { name?: string; color?: string }) => void;
}

function EditCategoryModal({ category, onClose, onSave }: EditCategoryModalProps) {
  const [form, setForm] = useState({
    name: category.name,
    color: category.color || '#f97316',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    await onSave({
      name: form.name,
      color: form.color,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Category</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800"
            />
          </div>

          <ColorPicker
            color={form.color}
            onChange={(color) => setForm({ ...form, color })}
            label="Color"
          />
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.name.trim() || saving}
            className="flex-1 py-2 bg-orange-500 text-white rounded-xl disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
