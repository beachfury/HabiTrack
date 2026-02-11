// apps/web/src/components/dashboard/widgets/EarningsWidget.tsx
import { Wallet, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EarningsWidgetProps {
  totalEarnings: number;
}

export function EarningsWidget({ totalEarnings = 0 }: EarningsWidgetProps) {
  return (
    <div className="h-full flex flex-col justify-center">
      <Link
        to="/paid-chores"
        className="flex items-center gap-4 p-4 rounded-xl text-[var(--color-success-foreground)] hover:brightness-110 transition-all"
        style={{
          background: `linear-gradient(to right, var(--color-success), color-mix(in srgb, var(--color-success) 80%, var(--color-primary)))`,
        }}
      >
        <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
          <Wallet size={28} />
        </div>
        <div>
          <p className="text-sm opacity-90">My Earnings</p>
          <p className="text-3xl font-bold">${totalEarnings.toFixed(2)}</p>
        </div>
        <TrendingUp size={24} className="ml-auto opacity-75" />
      </Link>
    </div>
  );
}
