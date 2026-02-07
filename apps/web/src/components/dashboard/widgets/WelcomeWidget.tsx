// apps/web/src/components/dashboard/widgets/WelcomeWidget.tsx
import { Sparkles } from 'lucide-react';

interface WelcomeWidgetProps {
  userName?: string;
}

export function WelcomeWidget({ userName = 'Guest' }: WelcomeWidgetProps) {
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="h-full flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          {greeting()}, {userName}!
          <Sparkles className="text-yellow-500" size={24} />
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Here's what's happening with your family today.
        </p>
      </div>
    </div>
  );
}
