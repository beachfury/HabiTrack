// apps/web/src/components/shopping/ShoppingListTab.tsx
import {
  Plus,
  Store,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Check,
  Sparkles,
  ShoppingCart,
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
  onAddSuggestion,
  onAddAllSuggestions,
  onAddItem,
  isAdmin,
}: ShoppingListTabProps) {
  const storeNames = Object.keys(itemsByStoreAndCategory);
  const hasItems = storeNames.length > 0;

  return (
    <div className="space-y-3">
      {/* Add Item Button */}
      {isAdmin && (
        <button
          onClick={onAddItem}
          className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-orange-500 hover:text-orange-500 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={20} /> Add Item to List
        </button>
      )}

      {/* Shopping List by Store */}
      {!hasItems ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
          <ShoppingCart size={48} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">Your shopping list is empty</p>
        </div>
      ) : (
        storeNames.map((storeName) => {
          const categories = itemsByStoreAndCategory[storeName];
          const categoryNames = Object.keys(categories);
          const itemCount = categoryNames.reduce((sum, cat) => sum + categories[cat].length, 0);
          const storeTotal = categoryNames.reduce(
            (sum, cat) =>
              sum +
              categories[cat].reduce(
                (s, item) =>
                  s + Number(item.storePrice || item.lowestPrice || 0) * Number(item.quantity),
                0,
              ),
            0,
          );
          const isExpanded = expandedStores.has(storeName);

          return (
            <div
              key={storeName}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              <button
                onClick={() => toggleStore(storeName)}
                className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <Store size={20} className="text-orange-500 flex-shrink-0" />
                <div className="flex-1 text-left min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">
                    {storeName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {itemCount} items • ${storeTotal.toFixed(2)}
                  </p>
                </div>
                {isExpanded ? (
                  <ChevronUp size={20} className="text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDown size={20} className="text-gray-400 flex-shrink-0" />
                )}
              </button>

              {isExpanded && (
                <div className="border-t border-gray-100 dark:border-gray-700">
                  {categoryNames.map((categoryName) => (
                    <div key={categoryName}>
                      <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/50 text-sm font-medium text-gray-600 dark:text-gray-400">
                        {categoryName}
                      </div>
                      {categories[categoryName].map((item) => (
                        <ListItemRow
                          key={item.id}
                          item={item}
                          onMarkPurchased={onMarkPurchased}
                          onRemove={onRemove}
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
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 overflow-hidden">
          <div className="p-3 flex items-center gap-3">
            <CheckCircle size={20} className="text-green-600" />
            <div>
              <p className="font-semibold text-green-800 dark:text-green-300">Purchased Today</p>
              <p className="text-sm text-green-600 dark:text-green-400">
                {purchasedToday.length} items
              </p>
            </div>
          </div>
          <div className="border-t border-green-200 dark:border-green-800">
            {purchasedToday.map((item) => (
              <div key={item.id} className="p-3 flex items-center gap-3 opacity-60">
                <ItemImage url={item.imageUrl} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white line-through truncate">
                    {item.itemName}
                  </p>
                  {item.brand && <p className="text-sm text-gray-500 truncate">{item.brand}</p>}
                </div>
                <Check size={20} className="text-green-600 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Suggestions - Now shows ALL items */}
      {suggestions.length > 0 && (
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800 overflow-hidden">
          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles size={20} className="text-purple-600" />
              <div>
                <p className="font-semibold text-purple-800 dark:text-purple-300">Suggestions</p>
                <p className="text-sm text-purple-600 dark:text-purple-400">
                  {suggestions.length} items
                </p>
              </div>
            </div>
            {isAdmin && suggestions.length > 1 && (
              <button
                onClick={() => onAddAllSuggestions()}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                Add All
              </button>
            )}
          </div>
          <div className="border-t border-purple-200 dark:border-purple-800 max-h-64 overflow-y-auto">
            {suggestions.map((s) => (
              <div
                key={s.catalogItemId}
                className="p-3 flex items-center gap-3 hover:bg-purple-100 dark:hover:bg-purple-800/30"
              >
                <ItemImage url={s.imageUrl} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{s.itemName}</p>
                  <p className="text-xs text-gray-500 truncate">{s.reason}</p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => onAddSuggestion(s.catalogItemId)}
                    className="p-2 text-purple-600 hover:bg-purple-200 dark:hover:bg-purple-700 rounded-lg flex-shrink-0"
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
