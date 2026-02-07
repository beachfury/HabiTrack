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
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Megaphone size={18} className="text-orange-500" />
          Announcements
          {unreadCount > 0 && (
            <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </h3>
        <Link to="/messages" className="text-sm text-blue-500 hover:text-blue-600">
          View All
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {recentAnnouncements.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No announcements
          </p>
        ) : (
          recentAnnouncements.map((announcement) => (
            <div
              key={announcement.id}
              className={`p-2 rounded-lg border ${
                announcement.isRead
                  ? 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                  : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
              }`}
            >
              <div className="flex items-start gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: announcement.sender.color || '#f97316' }}
                >
                  {announcement.sender.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {announcement.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                    {announcement.content}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
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
