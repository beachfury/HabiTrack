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
  Archive,
  Eye,
  EyeOff,
  RotateCcw,
  CheckSquare,
  Square,
} from 'lucide-react';
import { shoppingApi } from '../../api';
import { budgetsApi } from '../../api/budgets';
import { ColorPicker } from '../common/ColorPicker';
import { NewItemModal } from './modals/NewItemModal';
import { ModalPortal, ModalBody } from '../common/ModalPortal';
import type { ShoppingCategory, ShoppingStore, StoreRequest, CatalogItem, CatalogVisibility } from '../../types';
import type { Budget } from '../../types/budget';

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

  // Bulk selection
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Hidden items
  const [showHiddenItems, setShowHiddenItems] = useState(false);
  const [hiddenItems, setHiddenItems] = useState<CatalogItem[]>([]);
  const [loadingHidden, setLoadingHidden] = useState(false);

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
      // Fetch active + archived items for management view
      const data = await shoppingApi.getCatalogItems(undefined, undefined, 'active,archived');
      setCatalogItems(data.items);
    } catch (err) {
      console.error('Failed to fetch catalog items:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHiddenItems = async () => {
    setLoadingHidden(true);
    try {
      const data = await shoppingApi.getCatalogItems(undefined, undefined, 'hidden');
      setHiddenItems(data.items);
    } catch (err) {
      console.error('Failed to fetch hidden items:', err);
    } finally {
      setLoadingHidden(false);
    }
  };

  // Load hidden items when section is expanded
  useEffect(() => {
    if (showHiddenItems) {
      fetchHiddenItems();
    }
  }, [showHiddenItems]);

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

  const handleHideItem = async (itemId: number) => {
    try {
      await shoppingApi.setCatalogItemVisibility(itemId, 'hidden');
      setCatalogItems((prev) => prev.filter((i) => i.id !== itemId));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to hide item:', err);
    }
  };

  const handleSetVisibility = async (itemId: number, visibility: CatalogVisibility) => {
    try {
      await shoppingApi.setCatalogItemVisibility(itemId, visibility);
      if (visibility === 'hidden') {
        setCatalogItems((prev) => prev.filter((i) => i.id !== itemId));
      } else {
        setCatalogItems((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, visibility } : i)),
        );
      }
      // Refresh hidden items if the section is open
      if (showHiddenItems) fetchHiddenItems();
    } catch (err) {
      console.error('Failed to update visibility:', err);
    }
  };

  const handleRestoreItem = async (itemId: number) => {
    try {
      await shoppingApi.setCatalogItemVisibility(itemId, 'active');
      setHiddenItems((prev) => prev.filter((i) => i.id !== itemId));
      fetchCatalogItems();
    } catch (err) {
      console.error('Failed to restore item:', err);
    }
  };

  const handleBulkAction = async (visibility: CatalogVisibility) => {
    if (selectedIds.size === 0) return;
    try {
      await shoppingApi.bulkSetCatalogItemVisibility(Array.from(selectedIds), visibility);
      setSelectedIds(new Set());
      setSelectMode(false);
      fetchCatalogItems();
      if (showHiddenItems) fetchHiddenItems();
    } catch (err) {
      console.error('Failed to bulk update:', err);
    }
  };

  const toggleSelectItem = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllInCategory = (items: CatalogItem[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected = items.every((i) => next.has(i.id));
      if (allSelected) {
        items.forEach((i) => next.delete(i.id));
      } else {
        items.forEach((i) => next.add(i.id));
      }
      return next;
    });
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

  const handleSaveCategory = async (updates: { name?: string; color?: string; budgetId?: number | null }) => {
    if (!editingCategory) return;

    try {
      await shoppingApi.updateCategory(editingCategory.id, {
        name: updates.name,
        color: updates.color,
        budgetId: updates.budgetId,
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
        <div
          className="rounded-xl p-4 border"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-warning) 10%, transparent)',
            borderColor: 'color-mix(in srgb, var(--color-warning) 30%, transparent)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={20} className="text-[var(--color-warning)]" />
            <span className="font-medium text-[var(--color-warning)]">
              {storeRequests.length} pending store request{storeRequests.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-2">
            {storeRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between themed-shopping-list p-2"
              >
                <span className="text-[var(--color-foreground)]">{req.name}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => onApproveStore(req.id)}
                    className="p-1.5 text-[var(--color-success)] hover:bg-[var(--color-success)]/10 rounded-lg"
                  >
                    <Check size={18} />
                  </button>
                  <button
                    onClick={() => onDenyStore(req.id)}
                    className="p-1.5 text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 rounded-lg"
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
      <div className="flex gap-2 border-b border-[var(--color-border)]">
        <button
          onClick={() => setActiveSubTab('catalog')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeSubTab === 'catalog'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
              : 'border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
          }`}
        >
          <Package size={18} className="inline mr-2" />
          Catalog Items
        </button>
        <button
          onClick={() => setActiveSubTab('categories')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeSubTab === 'categories'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
              : 'border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
          }`}
        >
          <Tag size={18} className="inline mr-2" />
          Categories
        </button>
        <button
          onClick={() => setActiveSubTab('stores')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeSubTab === 'stores'
              ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
              : 'border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
          }`}
        >
          <Store size={18} className="inline mr-2" />
          Stores
        </button>
      </div>

      {/* Catalog Items Tab */}
      {activeSubTab === 'catalog' && (
        <div className="space-y-3">
          {/* Bulk Selection Toggle + Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setSelectMode(!selectMode);
                setSelectedIds(new Set());
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectMode
                  ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                  : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]/80'
              }`}
            >
              <CheckSquare size={14} />
              {selectMode ? 'Cancel Selection' : 'Select Items'}
            </button>

            {selectMode && selectedIds.size > 0 && (
              <>
                <span className="text-sm text-[var(--color-muted-foreground)]">
                  {selectedIds.size} selected
                </span>
                <button
                  onClick={() => handleBulkAction('archived')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--color-warning)]/15 text-[var(--color-warning)] hover:bg-[var(--color-warning)]/25"
                >
                  <Archive size={14} />
                  Archive ({selectedIds.size})
                </button>
                <button
                  onClick={() => handleBulkAction('hidden')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--color-destructive)]/15 text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/25"
                >
                  <EyeOff size={14} />
                  Hide ({selectedIds.size})
                </button>
              </>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-[var(--color-primary)]" size={32} />
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
                    className="themed-shopping-list overflow-hidden"
                  >
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-[var(--color-muted)]"
                    >
                      {selectMode && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            selectAllInCategory(items);
                          }}
                          className="cursor-pointer text-[var(--color-primary)]"
                        >
                          {items.every((i) => selectedIds.has(i.id)) ? (
                            <CheckSquare size={18} />
                          ) : (
                            <Square size={18} />
                          )}
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronDown size={20} className="text-[var(--color-muted-foreground)]" />
                      ) : (
                        <ChevronRight size={20} className="text-[var(--color-muted-foreground)]" />
                      )}
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color || '#f97316' }}
                      />
                      <span className="font-medium text-[var(--color-foreground)]">
                        {category.name}
                      </span>
                      <span className="text-sm text-[var(--color-muted-foreground)]">({items.length})</span>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-[var(--color-border)] divide-y divide-[var(--color-border)]">
                        {items.map((item) => (
                          <CatalogItemRow
                            key={item.id}
                            item={item}
                            selectMode={selectMode}
                            isSelected={selectedIds.has(item.id)}
                            onToggleSelect={() => toggleSelectItem(item.id)}
                            onEdit={() => setEditingItem(item)}
                            onSetVisibility={handleSetVisibility}
                            onHide={() => setDeleteConfirm({ type: 'item', id: item.id })}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Uncategorized items */}
              {uncategorizedItems.length > 0 && (
                <div className="themed-shopping-list overflow-hidden">
                  <button
                    onClick={() => toggleCategory(0)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-[var(--color-muted)]"
                  >
                    {selectMode && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          selectAllInCategory(uncategorizedItems);
                        }}
                        className="cursor-pointer text-[var(--color-primary)]"
                      >
                        {uncategorizedItems.every((i) => selectedIds.has(i.id)) ? (
                          <CheckSquare size={18} />
                        ) : (
                          <Square size={18} />
                        )}
                      </span>
                    )}
                    {expandedCategories.has(0) ? (
                      <ChevronDown size={20} className="text-[var(--color-muted-foreground)]" />
                    ) : (
                      <ChevronRight size={20} className="text-[var(--color-muted-foreground)]" />
                    )}
                    <span className="w-3 h-3 rounded-full bg-[var(--color-muted-foreground)]" />
                    <span className="font-medium text-[var(--color-foreground)]">Uncategorized</span>
                    <span className="text-sm text-[var(--color-muted-foreground)]">({uncategorizedItems.length})</span>
                  </button>

                  {expandedCategories.has(0) && (
                    <div className="border-t border-[var(--color-border)] divide-y divide-[var(--color-border)]">
                      {uncategorizedItems.map((item) => (
                        <CatalogItemRow
                          key={item.id}
                          item={item}
                          selectMode={selectMode}
                          isSelected={selectedIds.has(item.id)}
                          onToggleSelect={() => toggleSelectItem(item.id)}
                          onEdit={() => setEditingItem(item)}
                          onSetVisibility={handleSetVisibility}
                          onHide={() => setDeleteConfirm({ type: 'item', id: item.id })}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {catalogItems.length === 0 && (
                <div className="text-center py-8 text-[var(--color-muted-foreground)]">
                  <Package size={48} className="mx-auto mb-3 opacity-50" />
                  <p>No catalog items yet</p>
                </div>
              )}

              {/* Hidden Items Section */}
              <div className="themed-shopping-list overflow-hidden">
                <button
                  onClick={() => setShowHiddenItems(!showHiddenItems)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-[var(--color-muted)]"
                >
                  {showHiddenItems ? (
                    <ChevronDown size={20} className="text-[var(--color-muted-foreground)]" />
                  ) : (
                    <ChevronRight size={20} className="text-[var(--color-muted-foreground)]" />
                  )}
                  <EyeOff size={18} className="text-[var(--color-muted-foreground)]" />
                  <span className="font-medium text-[var(--color-muted-foreground)]">Hidden Items</span>
                  {hiddenItems.length > 0 && (
                    <span className="text-sm text-[var(--color-muted-foreground)]">({hiddenItems.length})</span>
                  )}
                </button>

                {showHiddenItems && (
                  <div className="border-t border-[var(--color-border)]">
                    {loadingHidden ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="animate-spin text-[var(--color-muted-foreground)]" size={20} />
                      </div>
                    ) : hiddenItems.length === 0 ? (
                      <p className="p-4 text-center text-sm text-[var(--color-muted-foreground)]">
                        No hidden items
                      </p>
                    ) : (
                      <div className="divide-y divide-[var(--color-border)]">
                        {hiddenItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 p-3 opacity-60 hover:opacity-100 hover:bg-[var(--color-muted)] transition-opacity"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-[var(--color-foreground)] truncate">
                                {item.name}
                              </p>
                              {item.brand && (
                                <p className="text-sm text-[var(--color-muted-foreground)] truncate">{item.brand}</p>
                              )}
                            </div>
                            <button
                              onClick={() => handleRestoreItem(item.id)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-[var(--color-success)] hover:bg-[var(--color-success)]/10 rounded-lg"
                              title="Restore to active"
                            >
                              <RotateCcw size={14} />
                              Restore
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Categories Tab */}
      {activeSubTab === 'categories' && (
        <div className="space-y-3">
          {/* Add Category Form */}
          <div className="themed-shopping-list p-4">
            <h3 className="font-semibold text-[var(--color-foreground)] mb-3 flex items-center gap-2">
              <Plus size={18} className="text-[var(--color-primary)]" />
              Add Category
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Category name..."
                className="themed-input w-full"
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              />
              <ColorPicker color={newCategoryColor} onChange={setNewCategoryColor} label="Color" />
              <button
                onClick={handleAddCategory}
                disabled={!newCategory.trim()}
                className="themed-btn-primary w-full disabled:opacity-50"
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
                className="flex items-center gap-3 p-3 themed-shopping-list"
              >
                <span
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: cat.color || '#f97316' }}
                />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-[var(--color-foreground)]">{cat.name}</span>
                  {cat.budgetName && (
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'color-mix(in srgb, var(--color-info) 15%, transparent)', color: 'var(--color-info)' }}>
                      → {cat.budgetName}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setEditingCategory(cat)}
                  className="p-2 text-[var(--color-info)] hover:bg-[var(--color-info)]/10 rounded-lg"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => setDeleteConfirm({ type: 'category', id: cat.id })}
                  className="p-2 text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 rounded-lg"
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
          <div className="themed-shopping-list p-4">
            <h3 className="font-semibold text-[var(--color-foreground)] mb-3 flex items-center gap-2">
              <Plus size={18} className="text-[var(--color-primary)]" />
              Add Store
            </h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newStore}
                onChange={(e) => setNewStore(e.target.value)}
                placeholder="Store name..."
                className="themed-input flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleAddStore()}
              />
              <button
                onClick={handleAddStore}
                disabled={!newStore.trim()}
                className="themed-btn-primary disabled:opacity-50"
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
                className="flex items-center gap-3 p-3 themed-shopping-list"
              >
                <Store size={18} className="text-[var(--color-info)]" />
                <span className="flex-1 font-medium text-[var(--color-foreground)]">
                  {store.name}
                </span>
                {store.isDefault && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--color-info) 15%, transparent)',
                      color: 'var(--color-info)',
                    }}
                  >
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

      {/* Delete/Hide Confirmation Modal */}
      {deleteConfirm && (
        <ModalPortal
          isOpen={true}
          onClose={() => setDeleteConfirm(null)}
          title={deleteConfirm.type === 'item' ? 'Hide Item' : 'Confirm Delete'}
          size="sm"
          footer={
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="themed-btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm.type === 'item') {
                    handleHideItem(deleteConfirm.id);
                  } else {
                    handleDeleteCategory(deleteConfirm.id);
                  }
                }}
                className="flex-1 py-2 bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)] rounded-xl"
              >
                {deleteConfirm.type === 'item' ? 'Hide' : 'Delete'}
              </button>
            </div>
          }
        >
          <ModalBody>
            <p className="text-[var(--color-muted-foreground)]">
              {deleteConfirm.type === 'item'
                ? 'This item will be hidden from the catalog. You can restore it later from the Hidden Items section.'
                : 'Are you sure you want to delete this category? This action cannot be undone.'}
            </p>
          </ModalBody>
        </ModalPortal>
      )}
    </div>
  );
}

// =============================================================================
// Catalog Item Row with visibility controls
// =============================================================================
interface CatalogItemRowProps {
  item: CatalogItem;
  selectMode: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onSetVisibility: (id: number, visibility: CatalogVisibility) => void;
  onHide: () => void;
}

function CatalogItemRow({
  item,
  selectMode,
  isSelected,
  onToggleSelect,
  onEdit,
  onSetVisibility,
  onHide,
}: CatalogItemRowProps) {
  const isArchived = item.visibility === 'archived';

  return (
    <div
      className={`flex items-center gap-3 p-3 hover:bg-[var(--color-muted)] ${isArchived ? 'opacity-60' : ''}`}
    >
      {selectMode && (
        <button onClick={onToggleSelect} className="text-[var(--color-primary)] flex-shrink-0">
          {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
        </button>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-[var(--color-foreground)] truncate">
            {item.name}
          </p>
          {isArchived && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-warning)]/20 text-[var(--color-warning)] font-medium flex-shrink-0">
              Archived
            </span>
          )}
        </div>
        {item.brand && (
          <p className="text-sm text-[var(--color-muted-foreground)] truncate">{item.brand}</p>
        )}
      </div>
      {!selectMode && (
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => onSetVisibility(item.id, isArchived ? 'active' : 'archived')}
            className={`p-2 rounded-lg ${
              isArchived
                ? 'text-[var(--color-success)] hover:bg-[var(--color-success)]/10'
                : 'text-[var(--color-warning)] hover:bg-[var(--color-warning)]/10'
            }`}
            title={isArchived ? 'Restore to active' : 'Archive'}
          >
            {isArchived ? <Eye size={16} /> : <Archive size={16} />}
          </button>
          <button
            onClick={onEdit}
            className="p-2 text-[var(--color-info)] hover:bg-[var(--color-info)]/10 rounded-lg"
            title="Edit"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={onHide}
            className="p-2 text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 rounded-lg"
            title="Hide"
          >
            <EyeOff size={16} />
          </button>
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
  onSave: (updates: { name?: string; color?: string; budgetId?: number | null }) => void;
}

function EditCategoryModal({ category, onClose, onSave }: EditCategoryModalProps) {
  const [form, setForm] = useState({
    name: category.name,
    color: category.color || '#f97316',
    budgetId: category.budgetId as number | null,
  });
  const [saving, setSaving] = useState(false);
  const [availableBudgets, setAvailableBudgets] = useState<Budget[]>([]);

  // Load available budgets for the dropdown
  useEffect(() => {
    budgetsApi.getBudgets({ active: true }).then((res) => setAvailableBudgets(res.budgets)).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    await onSave({
      name: form.name,
      color: form.color,
      budgetId: form.budgetId,
    });
    setSaving(false);
  };

  const footer = (
    <div className="flex gap-2">
      <button
        onClick={onClose}
        className="themed-btn-secondary flex-1"
      >
        Cancel
      </button>
      <button
        onClick={handleSubmit}
        disabled={!form.name.trim() || saving}
        className="themed-btn-primary flex-1 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save'}
      </button>
    </div>
  );

  return (
    <ModalPortal
      isOpen={true}
      onClose={onClose}
      title="Edit Category"
      size="md"
      footer={footer}
    >
      <ModalBody>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="themed-input w-full"
            />
          </div>

          <ColorPicker
            color={form.color}
            onChange={(color) => setForm({ ...form, color })}
            label="Color"
          />

          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
              Linked Budget (optional)
            </label>
            <select
              value={form.budgetId || ''}
              onChange={(e) => setForm({ ...form, budgetId: e.target.value ? Number(e.target.value) : null })}
              className="themed-input w-full"
            >
              <option value="">None</option>
              {availableBudgets.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.categoryName})
                </option>
              ))}
            </select>
            <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
              Purchases in this category will auto-create budget entries
            </p>
          </div>
        </div>
      </ModalBody>
    </ModalPortal>
  );
}
