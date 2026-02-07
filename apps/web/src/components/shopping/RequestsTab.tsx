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
          className="flex-1 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-orange-500 hover:text-orange-500 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={20} /> {isAdmin ? 'Add New Item' : 'Request New Item'}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search catalog to add or request..."
          className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800"
        />
      </div>

      {/* Pending Requests (Admin view) */}
      {isAdmin && pendingRequests.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 overflow-hidden">
          <button
            onClick={() => setShowPending(!showPending)}
            className="w-full p-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-yellow-600" />
              <div className="text-left">
                <p className="font-semibold text-yellow-800 dark:text-yellow-300">
                  Pending Requests
                </p>
                <p className="text-sm text-yellow-600">
                  {pendingRequests.length} awaiting approval
                </p>
              </div>
            </div>
            {showPending ? (
              <ChevronUp size={20} className="text-yellow-600" />
            ) : (
              <ChevronDown size={20} className="text-yellow-600" />
            )}
          </button>

          {showPending && (
            <div className="border-t border-yellow-200 dark:border-yellow-800">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-3 flex items-start gap-3 hover:bg-yellow-100/50 dark:hover:bg-yellow-800/20"
                >
                  {request.imageKey ? (
                    <img
                      src={request.imageKey}
                      alt=""
                      className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package size={20} className="text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {request.name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {request.requestType} • by {request.requestedByName}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => onApprove(request)}
                      className="p-2 text-green-600 hover:bg-green-100 rounded-lg"
                    >
                      <Check size={18} />
                    </button>
                    <button
                      onClick={() => onDeny(request.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
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
            className="bg-white dark:bg-gray-800 rounded-xl p-3 text-left hover:ring-2 hover:ring-orange-500 transition-all"
          >
            <ItemImage url={item.imageUrl} size="lg" />
            <p className="font-medium text-gray-900 dark:text-white mt-2 truncate text-sm">
              {item.name}
            </p>
            {item.brand && <p className="text-xs text-gray-500 truncate">{item.brand}</p>}
            {item.lowestPrice && (
              <p className="text-sm text-green-600 font-medium mt-1">
                ${Number(item.lowestPrice).toFixed(2)}
              </p>
            )}
          </button>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
          <Package size={48} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">No items found</p>
          <button
            onClick={isAdmin ? onNewItem : onRequestItem}
            className="mt-3 text-orange-600 font-medium"
          >
            + Add new item
          </button>
        </div>
      )}
    </div>
  );
}
