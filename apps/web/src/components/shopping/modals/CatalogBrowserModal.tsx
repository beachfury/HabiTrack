// apps/web/src/components/shopping/modals/CatalogBrowserModal.tsx
import { useState } from 'react';
import { Plus, Search, Package } from 'lucide-react';
import { ItemImage } from '../ItemImage';
import type { CatalogItem, ShoppingCategory, ShoppingStore } from '../../../types';
import { ModalPortal, ModalBody } from '../../common/ModalPortal';

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
    <ModalPortal
      isOpen={true}
      onClose={onClose}
      title={title}
      size="lg"
    >
      <div className="p-4 border-b border-[var(--color-border)] flex-shrink-0 -mx-4 -mt-4 mb-4">
        {/* Add New Item Button */}
        <button
          onClick={onAddNewItem}
          className="w-full mb-3 p-3 border-2 border-dashed border-[var(--color-border)] rounded-xl text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={18} /> {isAdmin ? 'Add New Item to Catalog' : 'Request New Item'}
        </button>

        {/* Search */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                onSearch(e.target.value);
              }}
              placeholder="Search catalog..."
              className="w-full pl-10 pr-4 py-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-card)] text-[var(--color-foreground)]"
              autoFocus
            />
          </div>
          <select
            value={selectedCategory || ''}
            onChange={(e) =>
              setSelectedCategory(e.target.value ? Number(e.target.value) : null)
            }
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
      </div>

      <ModalBody>
        {filteredItems.length === 0 ? (
          <div className="text-center py-8">
            <Package size={48} className="mx-auto mb-3 text-[var(--color-muted-foreground)] opacity-50" />
            <p className="text-[var(--color-muted-foreground)] mb-3">No items found</p>
            <button onClick={onAddNewItem} className="text-[var(--color-primary)] font-medium">
              + Add new item
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filteredItems.slice(0, 20).map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="bg-[var(--color-muted)] rounded-xl p-3 text-left hover:ring-2 hover:ring-[var(--color-primary)] transition-all"
              >
                <ItemImage url={item.imageUrl} />
                <p className="font-medium text-[var(--color-foreground)] mt-2 truncate text-sm">
                  {item.name}
                </p>
                {item.brand && (
                  <p className="text-xs text-[var(--color-muted-foreground)] truncate">{item.brand}</p>
                )}
                {item.lowestPrice && (
                  <p className="text-sm text-[var(--color-success)] font-medium mt-1">
                    ${Number(item.lowestPrice).toFixed(2)}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </ModalBody>
    </ModalPortal>
  );
}
