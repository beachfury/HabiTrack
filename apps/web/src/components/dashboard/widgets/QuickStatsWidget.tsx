// apps/web/src/components/dashboard/widgets/QuickStatsWidget.tsx
import { Calendar, CheckSquare, ShoppingCart, DollarSign } from 'lucide-react';

interface QuickStatsWidgetProps {
  eventsToday: number;
  choresDue: number;
  shoppingItems: number;
  earnings: number;
}

export function QuickStatsWidget({
  eventsToday = 0,
  choresDue = 0,
  shoppingItems = 0,
  earnings = 0,
}: QuickStatsWidgetProps) {
  const stats = [
    { label: 'Events Today', value: eventsToday, icon: Calendar, color: 'bg-blue-500' },
    { label: 'Chores Due', value: choresDue, icon: CheckSquare, color: 'bg-green-500' },
    { label: 'Shopping Items', value: shoppingItems, icon: ShoppingCart, color: 'bg-orange-500' },
    { label: 'Earnings', value: `$${earnings.toFixed(2)}`, icon: DollarSign, color: 'bg-purple-500' },
  ];

  return (
    <div className="h-full grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
        >
          <div className={`${stat.color} p-2 rounded-lg text-white`}>
            <stat.icon size={18} />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{stat.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
