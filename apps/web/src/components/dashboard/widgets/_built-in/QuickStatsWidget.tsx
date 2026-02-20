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
    { label: 'Events Today', value: eventsToday, icon: Calendar, colorVar: '--color-info' },
    { label: 'Chores Due', value: choresDue, icon: CheckSquare, colorVar: '--color-success' },
    { label: 'Shopping Items', value: shoppingItems, icon: ShoppingCart, colorVar: '--color-warning' },
    { label: 'Earnings', value: `$${earnings.toFixed(2)}`, icon: DollarSign, colorVar: '--color-primary' },
  ];

  return (
    <div className="h-full grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="themed-widget flex items-center gap-3"
        >
          <div
            className="p-2 rounded-lg text-white"
            style={{ backgroundColor: `var(${stat.colorVar})` }}
          >
            <stat.icon size={18} />
          </div>
          <div>
            <p className="text-lg font-bold text-[var(--color-foreground)]">{stat.value}</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
