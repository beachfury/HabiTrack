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
        className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white hover:from-green-600 hover:to-emerald-700 transition-colors"
      >
        <div className="p-3 bg-white/20 rounded-xl">
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
