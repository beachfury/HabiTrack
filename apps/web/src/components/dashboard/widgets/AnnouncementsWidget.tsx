// apps/web/src/components/dashboard/widgets/AnnouncementsWidget.tsx
import { Megaphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface Announcement {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  sender: {
    displayName: string;
    color: string;
  };
  isRead: boolean;
}

interface AnnouncementsWidgetProps {
  announcements: Announcement[];
}

export function AnnouncementsWidget({ announcements = [] }: AnnouncementsWidgetProps) {
  const recentAnnouncements = announcements.slice(0, 5);
  const unreadCount = announcements.filter(a => !a.isRead).length;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-[var(--color-foreground)] flex items-center gap-2">
          <Megaphone size={18} className="text-[var(--color-warning)]" />
          Announcements
          {unreadCount > 0 && (
            <span className="bg-[var(--color-warning)] text-[var(--color-warning-foreground)] text-xs px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </h3>
        <Link to="/messages" className="text-sm text-[var(--color-primary)] hover:opacity-80">
          View All
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {recentAnnouncements.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)] text-center py-4">
            No announcements
          </p>
        ) : (
          recentAnnouncements.map((announcement) => (
            <div
              key={announcement.id}
              className={`p-2 rounded-[var(--widget-radius)] border ${
                announcement.isRead
                  ? 'bg-[var(--widget-bg)] border-[var(--color-border)]'
                  : 'bg-[var(--color-warning)]/10 border-[var(--color-warning)]/30'
              }`}
            >
              <div className="flex items-start gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: announcement.sender.color || 'var(--color-warning)' }}
                >
                  {announcement.sender.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-foreground)] truncate">
                    {announcement.title}
                  </p>
                  <p className="text-xs text-[var(--color-muted-foreground)] line-clamp-2">
                    {announcement.content}
                  </p>
                  <p className="text-xs text-[var(--color-muted-foreground)]/70 mt-1">
                    {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
