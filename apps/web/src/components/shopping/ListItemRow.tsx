// apps/web/src/components/shopping/ListItemRow.tsx
import { Check, Trash2 } from 'lucide-react';
import { ItemImage } from './ItemImage';
import type { ShoppingListItem } from '../../types';

interface ListItemRowProps {
  item: ShoppingListItem;
  onMarkPurchased: (id: number) => void;
  onRemove: (id: number) => void;
  isAdmin: boolean;
}

export function ListItemRow({ item, onMarkPurchased, onRemove, isAdmin }: ListItemRowProps) {
  const price = Number(item.storePrice || item.lowestPrice || 0);
  const quantity = Number(item.quantity) || 1;

  return (
    <div className="p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      <ItemImage url={item.imageUrl} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-900 dark:text-white truncate">{item.itemName}</p>
          <span
            className={`px-1.5 py-0.5 text-xs rounded-full flex-shrink-0 ${
              item.listType === 'need'
                ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300'
                : 'bg-orange-100 text-orange-700 dark:bg-orange-800 dark:text-orange-300'
            }`}
          >
            {item.listType}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {item.brand && <span className="truncate">{item.brand}</span>}
          {quantity > 1 && <span>• Qty: {quantity}</span>}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-semibold text-gray-900 dark:text-white">
          ${(price * quantity).toFixed(2)}
        </p>
        {quantity > 1 && <p className="text-xs text-gray-500">${price.toFixed(2)} ea</p>}
      </div>
      {isAdmin && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onMarkPurchased(item.id)}
            className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-800 rounded-lg transition-colors"
            title="Mark as purchased"
          >
            <Check size={18} />
          </button>
          <button
            onClick={() => onRemove(item.id)}
            className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-800 rounded-lg transition-colors"
            title="Remove"
          >
            <Trash2 size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
