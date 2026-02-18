// apps/web/src/components/shopping/CatalogTab.tsx
import { useState } from 'react';
import {
  Plus,
  Search,
  Edit,
  Package,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Check,
  X,
  Send,
} from 'lucide-react';
import { ItemImage } from './ItemImage';
import { NewItemModal } from './modals/NewItemModal';
import { shoppingApi } from '../../api';
import type { CatalogItem, ShoppingCategory, ShoppingStore, ShoppingRequest } from '../../types';

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
  // Integrated request handling
  pendingRequests?: ShoppingRequest[];
  onApproveRequest?: (request: ShoppingRequest) => void;
  onDenyRequest?: (id: number) => void;
  onCreateRequest?: (data: { name: string; brand?: string; categoryId?: number }) => Promise<void>;
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
  pendingRequests = [],
  onApproveRequest,
  onDenyRequest,
  onCreateRequest,
}: CatalogTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<number | 'uncategorized'>>(
    new Set(),
  );
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [showQuickRequest, setShowQuickRequest] = useState(false);
  const [quickRequestName, setQuickRequestName] = useState('');
  const [quickRequestBrand, setQuickRequestBrand] = useState('');
  const [quickRequestCategory, setQuickRequestCategory] = useState<number | undefined>(undefined);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [showPendingRequests, setShowPendingRequests] = useState(true);

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

  // Handle quick request submission
  const handleQuickRequest = async () => {
    if (!quickRequestName.trim() || !onCreateRequest) return;

    setSubmittingRequest(true);
    try {
      await onCreateRequest({
        name: quickRequestName.trim(),
        brand: quickRequestBrand.trim() || undefined,
        categoryId: quickRequestCategory,
      });
      // Reset form
      setQuickRequestName('');
      setQuickRequestBrand('');
      setQuickRequestCategory(undefined);
      setShowQuickRequest(false);
    } catch (err) {
      console.error('Failed to submit request:', err);
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Pre-fill quick request with search term when showing
  const handleShowQuickRequest = () => {
    setQuickRequestName(searchTerm);
    setShowQuickRequest(true);
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
      {/* Pending Requests Panel (Admin only) */}
      {isAdmin && pendingRequests.length > 0 && (
        <div
          className="rounded-xl border overflow-hidden"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-warning) 10%, transparent)',
            borderColor: 'color-mix(in srgb, var(--color-warning) 30%, transparent)',
          }}
        >
          <button
            onClick={() => setShowPendingRequests(!showPendingRequests)}
            className="w-full p-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-[var(--color-warning)]" />
              <div className="text-left">
                <p className="font-semibold text-[var(--color-warning)]">Pending Requests</p>
                <p
                  className="text-sm"
                  style={{
                    color: 'color-mix(in srgb, var(--color-warning) 80%, var(--color-foreground))',
                  }}
                >
                  {pendingRequests.length} awaiting approval
                </p>
              </div>
            </div>
            {showPendingRequests ? (
              <ChevronDown size={20} className="text-[var(--color-warning)]" />
            ) : (
              <ChevronRight size={20} className="text-[var(--color-warning)]" />
            )}
          </button>

          {showPendingRequests && (
            <div
              className="border-t"
              style={{ borderColor: 'color-mix(in srgb, var(--color-warning) 30%, transparent)' }}
            >
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-3 flex items-start gap-3 hover:bg-[var(--color-warning)]/10"
                >
                  {request.imageKey ? (
                    <img
                      src={request.imageKey}
                      alt=""
                      className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-[var(--color-muted)] rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package size={20} className="text-[var(--color-muted-foreground)]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[var(--color-foreground)] truncate">
                      {request.name}
                    </p>
                    <p className="text-sm text-[var(--color-muted-foreground)] truncate">
                      {request.brand && `${request.brand} • `}
                      {request.requestType} • by {request.requestedByName}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {onApproveRequest && (
                      <button
                        onClick={() => onApproveRequest(request)}
                        className="p-2 text-[var(--color-success)] hover:bg-[var(--color-success)]/10 rounded-lg"
                        title="Approve & add to catalog"
                      >
                        <Check size={18} />
                      </button>
                    )}
                    {onDenyRequest && (
                      <button
                        onClick={() => onDenyRequest(request.id)}
                        className="p-2 text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 rounded-lg"
                        title="Deny request"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <button
        onClick={isAdmin ? onAddNewItem : onRequestItem}
        className="w-full p-3 border-2 border-dashed border-[var(--color-border)] rounded-xl text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={20} /> {isAdmin ? 'Add New Item' : 'Request New Item'}
      </button>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search catalog..."
            className="w-full pl-10 pr-4 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)]"
          />
        </div>
        <select
          value={selectedCategory || ''}
          onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
          className="px-3 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)] text-sm"
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
        <div className="themed-shopping-list p-6 text-center">
          <Package
            size={48}
            className="mx-auto mb-3 text-[var(--color-muted-foreground)] opacity-50"
          />
          <p className="text-[var(--color-muted-foreground)] mb-4">
            {searchTerm ? `No items found for "${searchTerm}"` : 'No items found'}
          </p>

          {/* Quick Request Form (non-admin users) */}
          {!isAdmin && onCreateRequest && (
            <>
              {!showQuickRequest ? (
                <button
                  onClick={handleShowQuickRequest}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-lg hover:opacity-90 transition-opacity"
                >
                  <Send size={16} />
                  Request "{searchTerm || 'this item'}"
                </button>
              ) : (
                <div className="mt-4 text-left space-y-3 max-w-sm mx-auto">
                  <p className="text-sm font-medium text-[var(--color-foreground)]">
                    Request a new item
                  </p>
                  <input
                    type="text"
                    value={quickRequestName}
                    onChange={(e) => setQuickRequestName(e.target.value)}
                    placeholder="Item name *"
                    className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-card)] text-[var(--color-foreground)] text-sm"
                    autoFocus
                  />
                  <input
                    type="text"
                    value={quickRequestBrand}
                    onChange={(e) => setQuickRequestBrand(e.target.value)}
                    placeholder="Brand (optional)"
                    className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-card)] text-[var(--color-foreground)] text-sm"
                  />
                  <select
                    value={quickRequestCategory || ''}
                    onChange={(e) =>
                      setQuickRequestCategory(e.target.value ? Number(e.target.value) : undefined)
                    }
                    className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-card)] text-[var(--color-foreground)] text-sm"
                  >
                    <option value="">Category (optional)</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowQuickRequest(false)}
                      className="flex-1 px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleQuickRequest}
                      disabled={!quickRequestName.trim() || submittingRequest}
                      className="flex-1 px-3 py-2 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-lg text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submittingRequest ? (
                        'Submitting...'
                      ) : (
                        <>
                          <Send size={14} />
                          Submit Request
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Admin can add directly */}
          {isAdmin && (
            <button
              onClick={onAddNewItem}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus size={16} />
              Add to Catalog
            </button>
          )}
        </div>
      ) : (
        Object.entries(itemsByCategory).map(([catName, catItems]) => {
          const isExpanded = isCategoryExpanded(catName);
          const category = categories.find((c) => c.name === catName);

          return (
            <div key={catName} className="themed-shopping-list overflow-hidden">
              {/* Category Header - Clickable to expand/collapse */}
              <button
                onClick={() => toggleCategory(catName)}
                className="w-full flex items-center gap-3 p-3 hover:bg-[var(--color-muted)] transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown
                    size={20}
                    className="text-[var(--color-muted-foreground)] flex-shrink-0"
                  />
                ) : (
                  <ChevronRight
                    size={20}
                    className="text-[var(--color-muted-foreground)] flex-shrink-0"
                  />
                )}
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: category?.color || 'var(--color-primary)' }}
                />
                <span className="font-semibold text-[var(--color-foreground)]">{catName}</span>
                <span className="text-sm text-[var(--color-muted-foreground)]">
                  ({catItems.length})
                </span>
              </button>

              {/* Category Items - Shown when expanded */}
              {isExpanded && (
                <div className="border-t border-[var(--color-border)] p-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {catItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-[var(--color-muted)] rounded-xl p-3 relative group"
                      >
                        <ItemImage url={item.imageUrl} size="lg" />
                        <p className="font-medium text-[var(--color-foreground)] mt-2 truncate text-sm">
                          {item.name}
                        </p>
                        {item.brand && (
                          <p className="text-xs text-[var(--color-muted-foreground)] truncate">
                            {item.brand}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          {item.lowestPrice ? (
                            <span className="text-sm text-[var(--color-success)] font-medium">
                              ${Number(item.lowestPrice).toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-xs text-[var(--color-muted-foreground)]">
                              No price
                            </span>
                          )}
                          <div className="flex gap-1">
                            <button
                              onClick={() => onAddToList(item)}
                              className="p-1.5 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-lg"
                              title="Add to list"
                            >
                              <Plus size={16} />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => setEditingItem(item)}
                                className="p-1.5 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-lg"
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
