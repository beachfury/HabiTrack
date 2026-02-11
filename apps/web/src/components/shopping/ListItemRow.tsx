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
    <div className="p-3 flex items-center gap-3 hover:bg-[var(--color-muted)] transition-colors">
      <ItemImage url={item.imageUrl} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-[var(--color-foreground)] truncate">{item.itemName}</p>
          <span
            className="px-1.5 py-0.5 text-xs rounded-full flex-shrink-0"
            style={
              item.listType === 'need'
                ? { backgroundColor: 'color-mix(in srgb, var(--color-success) 15%, transparent)', color: 'var(--color-success)' }
                : { backgroundColor: 'color-mix(in srgb, var(--color-warning) 15%, transparent)', color: 'var(--color-warning)' }
            }
          >
            {item.listType}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
          {item.brand && <span className="truncate">{item.brand}</span>}
          {quantity > 1 && <span>• Qty: {quantity}</span>}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-semibold text-[var(--color-foreground)]">
          ${(price * quantity).toFixed(2)}
        </p>
        {quantity > 1 && <p className="text-xs text-[var(--color-muted-foreground)]">${price.toFixed(2)} ea</p>}
      </div>
      {isAdmin && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onMarkPurchased(item.id)}
            className="p-2 text-[var(--color-success)] hover:bg-[var(--color-success)]/10 rounded-lg transition-colors"
            title="Mark as purchased"
          >
            <Check size={18} />
          </button>
          <button
            onClick={() => onRemove(item.id)}
            className="p-2 text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 rounded-lg transition-colors"
            title="Remove"
          >
            <Trash2 size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
