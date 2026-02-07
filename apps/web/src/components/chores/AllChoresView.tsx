// apps/web/src/components/chores/AllChoresView.tsx
import { AlertCircle, Calendar, Clock, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { ChoreCard } from './ChoreCard';
import type { ChoreInstance } from '../../types';
import type { UserOption } from '../../types';

interface UserChoreGroup {
  user: UserOption;
  overdue: ChoreInstance[];
  today: ChoreInstance[];
  upcoming: ChoreInstance[];
  total: number;
}

interface AllChoresViewProps {
  choresByUser: UserChoreGroup[];
  unassignedChores: ChoreInstance[];
  pendingApproval: ChoreInstance[];
  expandedUsers: Set<number>;
  isAdmin: boolean;
  onToggleUser: (userId: number) => void;
  onComplete: (instance: ChoreInstance) => void;
  onAdminAction: (instance: ChoreInstance) => void;
  onApprove: (instanceId: number) => void;
  onReject: (instanceId: number) => void;
}

export function AllChoresView({
  choresByUser,
  unassignedChores,
  pendingApproval,
  expandedUsers,
  isAdmin,
  onToggleUser,
  onComplete,
  onAdminAction,
  onApprove,
  onReject,
}: AllChoresViewProps) {
  return (
    <div className="space-y-4">
      {/* Pending Approval (Admin) - Full Width */}
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

      {/* User Cards - Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {choresByUser.map(({ user: u, overdue, today, upcoming, total }) => (
          <div
            key={u.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col"
          >
            {/* User Header */}
            <button
              onClick={() => onToggleUser(u.id)}
              className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
                style={{ backgroundColor: u.color || '#8b5cf6' }}
              >
                {(u.nickname || u.displayName).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white truncate">
                  {u.nickname || u.displayName}
                </p>
                <div className="flex items-center gap-3 text-sm">
                  {overdue.length > 0 && (
                    <span className="text-red-600">{overdue.length} overdue</span>
                  )}
                  {today.length > 0 && (
                    <span className="text-purple-600">{today.length} today</span>
                  )}
                  {upcoming.length > 0 && (
                    <span className="text-gray-500">{upcoming.length} upcoming</span>
                  )}
                </div>
              </div>
              {expandedUsers.has(u.id) ? (
                <ChevronUp size={20} className="text-gray-400 flex-shrink-0" />
              ) : (
                <ChevronDown size={20} className="text-gray-400 flex-shrink-0" />
              )}
            </button>

            {/* User Chores */}
            {expandedUsers.has(u.id) && (
              <div className="border-t border-gray-100 dark:border-gray-700 p-3 space-y-3 max-h-96 overflow-y-auto">
                {/* Overdue */}
                {overdue.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-red-600 mb-2 flex items-center gap-1">
                      <AlertCircle size={14} />
                      Overdue
                    </h3>
                    <div className="space-y-2">
                      {overdue.map((instance) => (
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
                {today.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-purple-600 mb-2 flex items-center gap-1">
                      <Calendar size={14} />
                      Today
                    </h3>
                    <div className="space-y-2">
                      {today.map((instance) => (
                        <ChoreCard
                          key={instance.id}
                          instance={instance}
                          onComplete={() => onComplete(instance)}
                          onAdminAction={() => onAdminAction(instance)}
                          isAdmin={isAdmin}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Upcoming */}
                {upcoming.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1">
                      <Clock size={14} />
                      Upcoming
                    </h3>
                    <div className="space-y-2">
                      {upcoming.map((instance) => (
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
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Unassigned Chores */}
      {unassignedChores.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <Users size={20} />
            Unassigned ({unassignedChores.length})
          </h2>
          <div className="space-y-2">
            {unassignedChores.map((instance) => (
              <ChoreCard
                key={instance.id}
                instance={instance}
                onComplete={() => onComplete(instance)}
                onAdminAction={() => onAdminAction(instance)}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
