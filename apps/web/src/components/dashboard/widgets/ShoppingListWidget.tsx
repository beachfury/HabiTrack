// apps/web/src/components/dashboard/widgets/ShoppingListWidget.tsx
import { ShoppingCart, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ShoppingItem {
  id: number;
  name: string;
  quantity: number;
  unit: string | null;
  purchased: boolean;
  categoryName: string;
}

interface ShoppingListWidgetProps {
  items: ShoppingItem[];
}

export function ShoppingListWidget({ items = [] }: ShoppingListWidgetProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-[var(--color-foreground)] flex items-center gap-2">
          <ShoppingCart size={18} className="text-[var(--color-warning)]" />
          Shopping List
          {items.length > 0 && (
            <span className="text-xs bg-[var(--color-warning)]/20 text-[var(--color-warning)] px-2 py-0.5 rounded-full">
              {items.length}
            </span>
          )}
        </h3>
        <Link to="/shopping" className="text-sm text-[var(--color-primary)] hover:opacity-80">
          View All
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)] text-center py-4">
            Shopping list is empty
          </p>
        ) : (
          items.slice(0, 10).map((item) => (
            <div
              key={item.id}
              className="themed-widget flex items-center gap-3"
            >
              <div className="w-5 h-5 rounded border-2 border-[var(--color-border)]" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-foreground)] truncate">
                  {item.name}
                </p>
                {item.quantity > 1 && (
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {item.quantity} {item.unit || 'items'}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
        {items.length > 10 && (
          <p className="text-xs text-[var(--color-muted-foreground)] text-center">
            +{items.length - 10} more items
          </p>
        )}
      </div>
    </div>
  );
}
