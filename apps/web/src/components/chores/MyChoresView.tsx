// apps/web/src/components/chores/MyChoresView.tsx
import { AlertCircle, Calendar, Clock, CheckSquare } from 'lucide-react';
import { ChoreCard } from './ChoreCard';
import type { ChoreInstance } from '../../types';

interface MyChoresViewProps {
  todayChores: ChoreInstance[];
  upcomingByDate: Record<string, ChoreInstance[]>;
  overdueChores: ChoreInstance[];
  pendingApproval: ChoreInstance[];
  isAdmin: boolean;
  onComplete: (instance: ChoreInstance) => void;
  onAdminAction: (instance: ChoreInstance) => void;
  onApprove: (instanceId: number) => void;
  onReject: (instanceId: number) => void;
  formatDate: (dateStr: string) => string;
}

export function MyChoresView({
  todayChores,
  upcomingByDate,
  overdueChores,
  pendingApproval,
  isAdmin,
  onComplete,
  onAdminAction,
  onApprove,
  onReject,
  formatDate,
}: MyChoresViewProps) {
  return (
    <div className="space-y-6">
      {/* Pending Approval (Admin) */}
      {isAdmin && pendingApproval.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-4">
          <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-3 flex items-center gap-2">
            <AlertCircle className="text-yellow-600" size={20} />
            Pending Approval ({pendingApproval.length})
          </h2>
          <div className="space-y-2">
            {pendingApproval.map((instance) => (
              <ChoreCard
                key={instance.id}
                instance={instance}
                onComplete={() => {}}
                onApprove={() => onApprove(instance.id)}
                onReject={() => onReject(instance.id)}
                showApproval
                isAdmin={isAdmin}
              />
            ))}
          </div>
        </div>
      )}

      {/* Overdue */}
      {overdueChores.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-red-600 mb-3 flex items-center gap-2">
            <AlertCircle size={20} />
            Overdue ({overdueChores.length})
          </h2>
          <div className="space-y-2">
            {overdueChores.map((instance) => (
              <ChoreCard
                key={instance.id}
                instance={instance}
                onComplete={() => onComplete(instance)}
                onAdminAction={() => onAdminAction(instance)}
                isOverdue
                isAdmin={isAdmin}
                showDate
              />
            ))}
          </div>
        </div>
      )}

      {/* Today */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Calendar size={20} />
          Today ({todayChores.length} remaining)
        </h2>
        {todayChores.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center text-gray-500 border border-gray-100 dark:border-gray-700">
            <CheckSquare size={48} className="mx-auto mb-3 opacity-30" />
            <p>No chores for today!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayChores.map((instance) => (
              <ChoreCard
                key={instance.id}
                instance={instance}
                onComplete={() => onComplete(instance)}
                onAdminAction={() => onAdminAction(instance)}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}
      </div>

      {/* Upcoming - grouped by date */}
      {Object.keys(upcomingByDate).length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Clock size={20} />
            Upcoming
          </h2>
          <div className="space-y-4">
            {Object.entries(upcomingByDate)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([date, dateChores]) => (
                <div key={date}>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">{formatDate(date)}</h3>
                  <div className="space-y-2">
                    {dateChores.map((instance) => (
                      <ChoreCard
                        key={instance.id}
                        instance={instance}
                        onComplete={() => {}}
                        onAdminAction={() => onAdminAction(instance)}
                        isAdmin={isAdmin}
                        isUpcoming
                      />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
