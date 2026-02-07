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
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <ShoppingCart size={18} className="text-orange-500" />
          Shopping List
          {items.length > 0 && (
            <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full">
              {items.length}
            </span>
          )}
        </h3>
        <Link to="/shopping" className="text-sm text-blue-500 hover:text-blue-600">
          View All
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            Shopping list is empty
          </p>
        ) : (
          items.slice(0, 10).map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
            >
              <div className="w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {item.name}
                </p>
                {item.quantity > 1 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {item.quantity} {item.unit || 'items'}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
        {items.length > 10 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            +{items.length - 10} more items
          </p>
        )}
      </div>
    </div>
  );
}
