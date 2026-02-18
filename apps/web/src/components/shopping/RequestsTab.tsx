// apps/web/src/components/shopping/RequestsTab.tsx
import { useState } from 'react';
import {
  Plus,
  Search,
  Package,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Check,
  X,
} from 'lucide-react';
import { ItemImage } from './ItemImage';
import type { ShoppingRequest, CatalogItem, ShoppingCategory } from '../../types';

interface RequestsTabProps {
  requests: ShoppingRequest[];
  catalogItems: CatalogItem[];
  categories: ShoppingCategory[];
  isAdmin: boolean;
  isKid: boolean;
  onApprove: (request: ShoppingRequest) => void;
  onDeny: (id: number) => void;
  onAddToList: (item: CatalogItem) => void;
  onNewItem: () => void;
  onRequestItem: () => void;
}

export function RequestsTab({
  requests,
  catalogItems,
  categories,
  isAdmin,
  isKid,
  onApprove,
  onDeny,
  onAddToList,
  onNewItem,
  onRequestItem,
}: RequestsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showPending, setShowPending] = useState(true);

  const pendingRequests = requests.filter((r) => r.status === 'pending');

  const filteredItems = searchTerm
    ? catalogItems.filter(
        (i) =>
          i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (i.brand && i.brand.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : catalogItems;

  return (
    <div className="space-y-3">
      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={isAdmin ? onNewItem : onRequestItem}
          className="flex-1 p-3 border-2 border-dashed border-[var(--color-border)] rounded-xl text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={20} /> {isAdmin ? 'Add New Item' : 'Request New Item'}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]"
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search catalog to add or request..."
          className="themed-input w-full pl-10"
        />
      </div>

      {/* Pending Requests (Admin view) */}
      {isAdmin && pendingRequests.length > 0 && (
        <div
          className="rounded-xl border overflow-hidden"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-warning) 10%, transparent)',
            borderColor: 'color-mix(in srgb, var(--color-warning) 30%, transparent)',
          }}
        >
          <button
            onClick={() => setShowPending(!showPending)}
            className="w-full p-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-[var(--color-warning)]" />
              <div className="text-left">
                <p className="font-semibold text-[var(--color-warning)]">
                  Pending Requests
                </p>
                <p className="text-sm" style={{ color: 'color-mix(in srgb, var(--color-warning) 80%, var(--color-foreground))' }}>
                  {pendingRequests.length} awaiting approval
                </p>
              </div>
            </div>
            {showPending ? (
              <ChevronUp size={20} className="text-[var(--color-warning)]" />
            ) : (
              <ChevronDown size={20} className="text-[var(--color-warning)]" />
            )}
          </button>

          {showPending && (
            <div className="border-t" style={{ borderColor: 'color-mix(in srgb, var(--color-warning) 30%, transparent)' }}>
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
                      {request.requestType} • by {request.requestedByName}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => onApprove(request)}
                      className="p-2 text-[var(--color-success)] hover:bg-[var(--color-success)]/10 rounded-lg"
                    >
                      <Check size={18} />
                    </button>
                    <button
                      onClick={() => onDeny(request.id)}
                      className="p-2 text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 rounded-lg"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Catalog Items Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {filteredItems.slice(0, 12).map((item) => (
          <button
            key={item.id}
            onClick={() => onAddToList(item)}
            className="themed-shopping-list p-3 text-left hover:ring-2 hover:ring-[var(--color-primary)] transition-all"
          >
            <ItemImage url={item.imageUrl} size="lg" />
            <p className="font-medium text-[var(--color-foreground)] mt-2 truncate text-sm">
              {item.name}
            </p>
            {item.brand && <p className="text-xs text-[var(--color-muted-foreground)] truncate">{item.brand}</p>}
            {item.lowestPrice && (
              <p className="text-sm text-[var(--color-success)] font-medium mt-1">
                ${Number(item.lowestPrice).toFixed(2)}
              </p>
            )}
          </button>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="themed-shopping-list p-8 text-center">
          <Package size={48} className="mx-auto mb-3 text-[var(--color-muted-foreground)] opacity-50" />
          <p className="text-[var(--color-muted-foreground)]">No items found</p>
          <button
            onClick={isAdmin ? onNewItem : onRequestItem}
            className="mt-3 text-[var(--color-primary)] font-medium"
          >
            + Add new item
          </button>
        </div>
      )}
    </div>
  );
}
