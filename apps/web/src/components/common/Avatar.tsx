// apps/web/src/components/common/Avatar.tsx
import { getInitials, getContrastColor } from '../../utils';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  color?: string | null;
  size?: AvatarSize;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
};

export function Avatar({ name, imageUrl, color, size = 'md', className = '' }: AvatarProps) {
  const bgColor = color || '#6b7280';
  const textColor = getContrastColor(bgColor);

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold flex-shrink-0 ${className}`}
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {getInitials(name)}
    </div>
  );
}

// Avatar with online status indicator
export function AvatarWithStatus({
  isOnline,
  ...props
}: AvatarProps & { isOnline?: boolean }) {
  return (
    <div className="relative">
      <Avatar {...props} />
      {isOnline !== undefined && (
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
            isOnline ? 'bg-green-500' : 'bg-gray-400'
          }`}
        />
      )}
    </div>
  );
}

// Avatar group (overlapping)
export function AvatarGroup({
  users,
  max = 4,
  size = 'sm',
}: {
  users: Array<{ name: string; imageUrl?: string | null; color?: string | null }>;
  max?: number;
  size?: AvatarSize;
}) {
  const visible = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className="flex -space-x-2">
      {visible.map((user, i) => (
        <Avatar
          key={i}
          {...user}
          size={size}
          className="ring-2 ring-white dark:ring-gray-800"
        />
      ))}
      {remaining > 0 && (
        <div
          className={`${sizeClasses[size]} rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-medium text-gray-600 dark:text-gray-300 ring-2 ring-white dark:ring-gray-800`}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
