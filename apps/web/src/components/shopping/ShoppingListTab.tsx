// apps/web/src/components/shopping/ShoppingListTab.tsx
import {
  Plus,
  Store,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Check,
  ShoppingCart,
  Sparkles,
  Utensils,
  TrendingUp,
} from 'lucide-react';
import { ItemImage } from './ItemImage';
import { ListItemRow } from './ListItemRow';
import type { ShoppingListItem, Suggestion } from '../../types';

interface ShoppingListTabProps {
  itemsByStoreAndCategory: Record<string, Record<string, ShoppingListItem[]>>;
  purchasedToday: ShoppingListItem[];
  suggestions: Suggestion[];
  expandedStores: Set<string>;
  toggleStore: (store: string) => void;
  onMarkPurchased: (id: number) => void;
  onRemove: (id: number) => void;
  onEdit: (item: ShoppingListItem) => void;
  onAddSuggestion: (catalogItemId: number) => void;
  onAddAllSuggestions: () => void;
  onAddItem: () => void;
  isAdmin: boolean;
}

export function ShoppingListTab({
  itemsByStoreAndCategory,
  purchasedToday,
  suggestions,
  expandedStores,
  toggleStore,
  onMarkPurchased,
  onRemove,
  onEdit,
  onAddSuggestion,
  onAddAllSuggestions,
  onAddItem,
  isAdmin,
}: ShoppingListTabProps) {
  const storeNames = Object.keys(itemsByStoreAndCategory);
  const hasItems = storeNames.length > 0;

  // Helper to get suggestion type icon
  const getSuggestionIcon = (type?: string) => {
    if (type === 'meal_ingredient') return <Utensils size={12} className="inline" />;
    if (type === 'popular') return <TrendingUp size={12} className="inline" />;
    return null;
  };

  return (
    <div className="space-y-3">
      {/* Add Item Button */}
      <button
        onClick={onAddItem}
        className="w-full p-3 border-2 border-dashed border-[var(--color-border)] rounded-xl text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={20} /> Add Item to List
      </button>

      {/* Shopping List by Store */}
      {!hasItems ? (
        <div className="themed-card p-8 text-center">
          <ShoppingCart
            size={48}
            className="mx-auto mb-3 text-[var(--color-muted-foreground)] opacity-50"
          />
          <p className="text-[var(--color-muted-foreground)]">Your shopping list is empty</p>
        </div>
      ) : (
        storeNames.map((storeName) => {
          const categories = itemsByStoreAndCategory[storeName];
          const categoryNames = Object.keys(categories);
          const itemCount = categoryNames.reduce((sum, cat) => sum + categories[cat].length, 0);
          const storeTotal = categoryNames.reduce(
            (sum, cat) =>
              sum +
              categories[cat].reduce((s, item) => {
                // If a specific store is selected, use ONLY that store's price
                // Only use lowestPrice when no store is selected
                const price = item.storeId
                  ? Number(item.storePrice || 0)
                  : Number(item.storePrice || item.lowestPrice || 0);
                return s + price * Number(item.quantity);
              }, 0),
            0,
          );
          const isExpanded = expandedStores.has(storeName);

          return (
            <div key={storeName} className="themed-card overflow-hidden">
              <button
                onClick={() => toggleStore(storeName)}
                className="w-full p-3 flex items-center gap-3 hover:bg-[var(--color-muted)] transition-colors"
              >
                <Store size={20} className="text-[var(--color-primary)] flex-shrink-0" />
                <div className="flex-1 text-left min-w-0">
                  <p className="font-semibold text-[var(--color-foreground)] truncate">
                    {storeName}
                  </p>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    {itemCount} items • ${storeTotal.toFixed(2)}
                  </p>
                </div>
                {isExpanded ? (
                  <ChevronUp
                    size={20}
                    className="text-[var(--color-muted-foreground)] flex-shrink-0"
                  />
                ) : (
                  <ChevronDown
                    size={20}
                    className="text-[var(--color-muted-foreground)] flex-shrink-0"
                  />
                )}
              </button>

              {isExpanded && (
                <div className="border-t border-[var(--color-border)]">
                  {categoryNames.map((categoryName) => (
                    <div key={categoryName}>
                      <div className="px-3 py-2 bg-[var(--color-muted)] text-sm font-medium text-[var(--color-muted-foreground)]">
                        {categoryName}
                      </div>
                      {categories[categoryName].map((item) => (
                        <ListItemRow
                          key={item.id}
                          item={item}
                          onMarkPurchased={onMarkPurchased}
                          onRemove={onRemove}
                          onEdit={onEdit}
                          isAdmin={isAdmin}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Purchased Today */}
      {purchasedToday.length > 0 && (
        <div
          className="rounded-xl border overflow-hidden"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-success) 10%, transparent)',
            borderColor: 'color-mix(in srgb, var(--color-success) 30%, transparent)',
          }}
        >
          <div className="p-3 flex items-center gap-3">
            <CheckCircle size={20} className="text-[var(--color-success)]" />
            <div>
              <p className="font-semibold text-[var(--color-success)]">Purchased Today</p>
              <p
                className="text-sm"
                style={{
                  color: 'color-mix(in srgb, var(--color-success) 80%, var(--color-foreground))',
                }}
              >
                {purchasedToday.length} items
              </p>
            </div>
          </div>
          <div
            className="border-t"
            style={{ borderColor: 'color-mix(in srgb, var(--color-success) 30%, transparent)' }}
          >
            {purchasedToday.map((item) => (
              <div key={item.id} className="p-3 flex items-center gap-3 opacity-60">
                <ItemImage url={item.imageUrl} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--color-foreground)] line-through truncate">
                    {item.itemName}
                  </p>
                  {item.brand && (
                    <p className="text-sm text-[var(--color-muted-foreground)] truncate">
                      {item.brand}
                    </p>
                  )}
                </div>
                <Check size={20} className="text-[var(--color-success)] flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Suggestions */}
      {suggestions.length > 0 && (
        <div
          className="rounded-xl border overflow-hidden"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
            borderColor: 'color-mix(in srgb, var(--color-primary) 30%, transparent)',
          }}
        >
          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles size={20} className="text-[var(--color-primary)]" />
              <div>
                <p className="font-semibold text-[var(--color-primary)]">Suggestions</p>
                <p
                  className="text-sm"
                  style={{
                    color: 'color-mix(in srgb, var(--color-primary) 80%, var(--color-foreground))',
                  }}
                >
                  {suggestions.length} items
                </p>
              </div>
            </div>
            {isAdmin && suggestions.length > 1 && (
              <button
                onClick={() => onAddAllSuggestions()}
                className="text-sm text-[var(--color-primary)] hover:opacity-80 font-medium"
              >
                Add All
              </button>
            )}
          </div>
          <div
            className="border-t max-h-64 overflow-y-auto"
            style={{ borderColor: 'color-mix(in srgb, var(--color-primary) 30%, transparent)' }}
          >
            {suggestions.map((s) => (
              <div
                key={s.catalogItemId}
                className="p-3 flex items-center gap-3 hover:bg-[var(--color-primary)]/10"
              >
                <ItemImage url={s.imageUrl} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[var(--color-foreground)] truncate">
                    {s.itemName}
                  </p>
                  <p className="text-xs text-[var(--color-muted-foreground)] truncate flex items-center gap-1">
                    {getSuggestionIcon(s.suggestionType)}
                    {s.reason}
                  </p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => onAddSuggestion(s.catalogItemId)}
                    className="p-2 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 rounded-lg flex-shrink-0"
                  >
                    <Plus size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
