// _registry/StaticWeatherPreview.tsx
// Static weather preview for the Store — mirrors WeatherWidget render but with hardcoded data
// No API calls, no state, no effects — pure render

import { Sun, MapPin } from 'lucide-react';

export function StaticWeatherPreview() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-1 text-xs text-[var(--color-muted-foreground)] mb-2">
        <MapPin size={12} />
        <span className="truncate">Current Location</span>
      </div>

      <div className="flex-1 flex items-center gap-4">
        <div className="flex-shrink-0">
          <Sun size={48} className="text-[var(--color-warning)]" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-[var(--color-foreground)]">72</span>
            <span className="text-lg text-[var(--color-muted-foreground)]">°F</span>
          </div>
          <p className="text-sm text-[var(--color-foreground)]/80 truncate">Partly Cloudy</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--color-muted-foreground)] mt-2 pt-2 border-t border-[var(--color-border)]">
        <span>Humidity: 45%</span>
        <span>Wind: 8 mph</span>
      </div>
    </div>
  );
}
