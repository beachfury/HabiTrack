// apps/web/src/components/shopping/ConfidenceBadge.tsx
import type { ConfidenceLevel } from '../../types';
import { CONFIDENCE_COLORS } from '../../types';

interface ConfidenceBadgeProps {
  level: ConfidenceLevel;
  className?: string;
}

export function ConfidenceBadge({ level, className = '' }: ConfidenceBadgeProps) {
  return (
    <span className={`px-2 py-0.5 text-xs rounded-full ${CONFIDENCE_COLORS[level]} ${className}`}>
      {level}
    </span>
  );
}
