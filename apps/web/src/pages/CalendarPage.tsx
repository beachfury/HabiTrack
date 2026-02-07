import { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  CheckSquare,
  Check,
  SkipForward,
  Calendar,
  Clock,
  MapPin,
} from 'lucide-react';
import { api, type CalendarEvent, type CreateEventData, type ChoreInstance } from '../api';
import { useAuth } from '../context/AuthContext';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Teal', value: '#14b8a6' },
];

interface CalendarUser {
  id: number;
  displayName: string;
  nickname: string | null;
  roleId: string;
  color: string | null;
}

// Helper to normalize dates for comparison
function normalizeDate(dateStr: string): string {
  if (!dateStr) return '';
  return dateStr.substring(0, 10);
}

// Format date to YYYY-MM-DD from Date object (LOCAL time, no timezone conversion)
function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Format date to YYYY-MM-DDTHH:mm from Date object (LOCAL time)
function formatDateTimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function CalendarPage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [chores, setChores] = useState<ChoreInstance[]>([]);
  const [users, setUsers] = useState<CalendarUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChores, setShowChores] = useState(true);

  // Modal states
  const [showDayModal, setShowDayModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedChore, setSelectedChore] = useState<ChoreInstance | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateEventData>({
    title: '',
    description: '',
    start: '',
    end: '',
    allDay: false,
    color: COLORS[0].value,
    location: '',
    assignedTo: undefined,
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Can current user assign to others?
  const canAssignToOthers = user?.role === 'admin';

  // Fetch events, chores and users when month changes
  useEffect(() => {
    // Clear existing data immediately to prevent stale data flash
    setEvents([]);
    setChores([]);
    setLoading(true);

    fetchEvents();
    fetchChores();
    fetchUsers();
  }, [year, month]);

  const fetchUsers = async () => {
    try {
      const data = await api.getCalendarUsers();
      setUsers(data.users);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

      // Extend range to include visible days from prev/next months
      startOfMonth.setDate(startOfMonth.getDate() - startOfMonth.getDay());
      endOfMonth.setDate(endOfMonth.getDate() + (6 - endOfMonth.getDay()));

      const data = await api.getEvents(startOfMonth.toISOString(), endOfMonth.toISOString());
      setEvents(data.events);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChores = async () => {
    try {
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0);

      // Extend range to include visible days from prev/next months
      startOfMonth.setDate(startOfMonth.getDate() - startOfMonth.getDay());
      endOfMonth.setDate(endOfMonth.getDate() + (6 - endOfMonth.getDay()));

      const startStr = formatDateLocal(startOfMonth);
      const endStr = formatDateLocal(endOfMonth);

      const data = await api.getChoreInstances({ startDate: startStr, endDate: endStr });
      setChores(data.instances);
    } catch (err) {
      console.error('Failed to fetch chores:', err);
    }
  };

  const getDaysInMonth = () => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDay = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days: (Date | null)[] = [];

    // Add days from previous month
    const prevMonth = new Date(year, month, 0);
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevMonth.getDate() - i));
    }

    // Add days of current month
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }

    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === month;
  };

  const getEventsForDay = (date: Date) => {
    const dayStr = formatDateLocal(date);

    return events.filter((event) => {
      // Extract just the date part from the event start
      const eventDateStr = normalizeDate(event.start);

      if (event.allDay) {
        const eventEndStr = event.end ? normalizeDate(event.end) : eventDateStr;
        return dayStr >= eventDateStr && dayStr <= eventEndStr;
      }

      // For timed events, check if the event falls on this day
      const eventStart = new Date(event.start);
      const eventEnd = event.end ? new Date(event.end) : eventStart;

      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      return eventStart <= dayEnd && eventEnd >= dayStart;
    });
  };

  const getChoresForDay = (date: Date): ChoreInstance[] => {
    const dateStr = formatDateLocal(date);
    return chores.filter((chore) => normalizeDate(chore.dueDate) === dateStr);
  };

  const isMultiDayEvent = (event: CalendarEvent) => {
    if (!event.end) return false;
    const startStr = normalizeDate(event.start);
    const endStr = normalizeDate(event.end);
    return startStr !== endStr;
  };

  const isEventStart = (event: CalendarEvent, date: Date) => {
    const eventDateStr = normalizeDate(event.start);
    const dayStr = formatDateLocal(date);
    return eventDateStr === dayStr;
  };

  const isEventEnd = (event: CalendarEvent, date: Date) => {
    if (!event.end) return true;
    const eventEndStr = normalizeDate(event.end);
    const dayStr = formatDateLocal(date);
    return eventEndStr === dayStr;
  };

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Close all modals
  const closeModals = () => {
    setShowDayModal(false);
    setShowEventModal(false);
    setSelectedDate(null);
    setSelectedEvent(null);
    setSelectedChore(null);
  };

  // Open day detail modal
  const openDayModal = (date: Date) => {
    setSelectedDate(date);
    setShowDayModal(true);
  };

  // Open event form modal for new event
  // FIXED: Use simple local date formatting without timezone conversion
  const openNewEventModal = (date: Date) => {
    setSelectedEvent(null);
    setSelectedDate(date);

    // Use the date as-is with a default time of 9:00 AM
    const eventDate = new Date(date);
    eventDate.setHours(9, 0, 0, 0);

    const dateStr = formatDateTimeLocal(eventDate);

    setFormData({
      title: '',
      description: '',
      start: dateStr,
      end: '',
      allDay: false,
      color: COLORS[0].value,
      location: '',
      assignedTo: canAssignToOthers ? undefined : user?.id,
    });
    setShowDayModal(false);
    setShowEventModal(true);
  };

  // Open event form modal for editing
  // FIXED: Use simple local date formatting without timezone conversion
  const openEditEventModal = (event: CalendarEvent) => {
    setSelectedEvent(event);

    // Parse the stored date and format it for the input
    const startDate = new Date(event.start);
    const startStr = formatDateTimeLocal(startDate);

    let endStr = '';
    if (event.end) {
      const endDate = new Date(event.end);
      endStr = formatDateTimeLocal(endDate);
    }

    setFormData({
      title: event.title,
      description: event.description || '',
      start: startStr,
      end: endStr,
      allDay: event.allDay,
      color: event.color || COLORS[0].value,
      location: event.location || '',
      assignedTo: event.assignedTo || undefined,
    });
    setShowDayModal(false);
    setShowEventModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Prepare data for submission
      const submitData = { ...formData };

      // For all-day events, ensure we send just the date with a noon time
      // This prevents timezone issues where midnight UTC becomes previous day in PST
      if (formData.allDay) {
        if (submitData.start && !submitData.start.includes('T')) {
          submitData.start = submitData.start + 'T12:00';
        } else if (submitData.start && submitData.start.includes('T')) {
          // Replace the time with noon
          submitData.start = submitData.start.split('T')[0] + 'T12:00';
        }
        if (submitData.end && !submitData.end.includes('T')) {
          submitData.end = submitData.end + 'T12:00';
        } else if (submitData.end && submitData.end.includes('T')) {
          submitData.end = submitData.end.split('T')[0] + 'T12:00';
        }
      }

      if (selectedEvent) {
        await api.updateEvent(selectedEvent.id, submitData);
      } else {
        await api.createEvent(submitData);
      }
      closeModals();
      fetchEvents();
    } catch (err) {
      console.error('Failed to save event:', err);
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;

    if (confirm('Are you sure you want to delete this event?')) {
      try {
        await api.deleteEvent(selectedEvent.id);
        closeModals();
        fetchEvents();
      } catch (err) {
        console.error('Failed to delete event:', err);
      }
    }
  };

  const handleCompleteChore = async (chore: ChoreInstance) => {
    try {
      await api.completeChoreInstance(chore.id, {});
      fetchChores();
    } catch (err) {
      console.error('Failed to complete chore:', err);
    }
  };

  const handleSkipChore = async (chore: ChoreInstance) => {
    if (confirm("Skip this chore? It won't award points.")) {
      try {
        await api.skipChoreInstance(chore.id);
        fetchChores();
      } catch (err) {
        console.error('Failed to skip chore:', err);
      }
    }
  };

  const days = getDaysInMonth();

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatFullDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="p-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {MONTHS[month]} {year}
          </h1>
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRight size={20} className="text-gray-600 dark:text-gray-300" />
            </button>
          </div>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm font-medium text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
          >
            Today
          </button>
        </div>
        <div className="flex items-center gap-3">
          {/* Toggle Chores */}
          <button
            onClick={() => setShowChores(!showChores)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              showChores
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            <CheckSquare size={16} />
            Chores
          </button>
          <button
            onClick={() => openNewEventModal(new Date())}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={20} />
            Add Event
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-700">
          {DAYS.map((day) => (
            <div
              key={day}
              className="py-3 text-center text-sm font-semibold text-gray-500 dark:text-gray-400"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="flex-1 grid grid-cols-7 grid-rows-6">
          {days.map((date, index) => {
            if (!date)
              return (
                <div
                  key={index}
                  className="border-b border-r border-gray-50 dark:border-gray-700"
                />
              );

            const dayEvents = getEventsForDay(date);
            const dayChores = showChores ? getChoresForDay(date) : [];
            const isCurrentDay = isToday(date);
            const inCurrentMonth = isCurrentMonth(date);
            const dayOfWeek = date.getDay();

            // Combine events and chores for display count
            const totalItems = dayEvents.length + dayChores.length;
            const maxDisplay = 3;

            return (
              <div
                key={index}
                onClick={() => openDayModal(date)}
                className={`border-b border-r border-gray-50 dark:border-gray-700 p-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors min-h-[100px] ${
                  !inCurrentMonth ? 'bg-gray-50/50 dark:bg-gray-900/30' : ''
                }`}
              >
                <div className="flex items-center justify-center mb-1">
                  <span
                    className={`w-7 h-7 flex items-center justify-center text-sm rounded-full ${
                      isCurrentDay
                        ? 'bg-purple-600 text-white font-bold'
                        : inCurrentMonth
                          ? 'text-gray-900 dark:text-gray-100'
                          : 'text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    {date.getDate()}
                  </span>
                </div>
                <div className="space-y-1">
                  {/* Events */}
                  {dayEvents.slice(0, maxDisplay).map((event) => {
                    const isStart = isEventStart(event, date);
                    const isEnd = isEventEnd(event, date);
                    const isMultiDay = isMultiDayEvent(event);
                    const displayName = event.assignedToName || '';

                    return (
                      <div
                        key={`event-${event.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditEventModal(event);
                        }}
                        title={`${displayName ? `${displayName}: ` : ''}${event.title}${event.location ? `\n📍 ${event.location}` : ''}${event.description ? `\n${event.description}` : ''}`}
                        className={`text-xs px-2 py-1 text-white cursor-pointer hover:opacity-80 overflow-hidden ${
                          isMultiDay
                            ? `${isStart ? 'rounded-l ml-0' : '-ml-1'} ${isEnd ? 'rounded-r mr-0' : '-mr-1'}`
                            : 'rounded truncate'
                        }`}
                        style={{
                          backgroundColor: event.color || COLORS[0].value,
                          marginLeft:
                            isMultiDay && !isStart && dayOfWeek !== 0 ? '-4px' : undefined,
                          marginRight: isMultiDay && !isEnd && dayOfWeek !== 6 ? '-4px' : undefined,
                          borderRadius: isMultiDay
                            ? `${isStart || dayOfWeek === 0 ? '4px' : '0'} ${isEnd || dayOfWeek === 6 ? '4px' : '0'} ${isEnd || dayOfWeek === 6 ? '4px' : '0'} ${isStart || dayOfWeek === 0 ? '4px' : '0'}`
                            : undefined,
                        }}
                      >
                        {isStart || dayOfWeek === 0 ? (
                          <span className="truncate block">
                            {displayName && <span className="font-semibold">{displayName}: </span>}
                            {event.title}
                          </span>
                        ) : (
                          ''
                        )}
                      </div>
                    );
                  })}

                  {/* Chores */}
                  {dayChores.slice(0, Math.max(0, maxDisplay - dayEvents.length)).map((chore) => {
                    const isCompleted = chore.status === 'completed' || chore.status === 'approved';
                    return (
                      <div
                        key={`chore-${chore.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedChore(chore);
                        }}
                        title={`${chore.assignedToName ? `${chore.assignedToName}: ` : ''}${chore.title} (${chore.points} pts)`}
                        className={`text-xs px-2 py-1 rounded truncate flex items-center gap-1 cursor-pointer hover:opacity-80 ${
                          isCompleted
                            ? 'bg-green-100 text-green-700 line-through dark:bg-green-900/30 dark:text-green-400'
                            : chore.status === 'pending'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        <CheckSquare size={10} className="flex-shrink-0" />
                        <span className="truncate">
                          {chore.assignedToName && (
                            <span className="font-semibold">
                              {chore.assignedToName.split(' ')[0]}:{' '}
                            </span>
                          )}
                          {chore.title}
                        </span>
                      </div>
                    );
                  })}

                  {totalItems > maxDisplay && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
                      +{totalItems - maxDisplay} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Detail Modal */}
      {showDayModal && selectedDate && (
        <DayDetailModal
          date={selectedDate}
          events={getEventsForDay(selectedDate)}
          chores={showChores ? getChoresForDay(selectedDate) : []}
          onClose={closeModals}
          onNewEvent={() => openNewEventModal(selectedDate)}
          onEditEvent={openEditEventModal}
          onCompleteChore={handleCompleteChore}
          onSkipChore={handleSkipChore}
          formatTime={formatTime}
          formatFullDate={formatFullDate}
        />
      )}

      {/* Event Form Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {selectedEvent ? 'Edit Event' : 'New Event'}
              </h2>
              <button
                onClick={closeModals}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Event title"
                  required
                />
              </div>

              {/* Assigned To - Only show dropdown for admins */}
              {canAssignToOthers && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Assigned To
                  </label>
                  <select
                    value={formData.assignedTo || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        assignedTo: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Everyone / Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nickname || u.displayName} ({u.roleId})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="allDay"
                  checked={formData.allDay}
                  onChange={(e) => setFormData({ ...formData, allDay: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="allDay" className="text-sm text-gray-700 dark:text-gray-300">
                  All day event
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {formData.allDay ? 'Date' : 'Start'}
                </label>
                <input
                  type={formData.allDay ? 'date' : 'datetime-local'}
                  value={formData.allDay ? formData.start.slice(0, 10) : formData.start}
                  onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>

              {!formData.allDay && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.end}
                    onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Event location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Event description"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color
                </label>
                <div className="flex gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        formData.color === color.value
                          ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                          : ''
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                {selectedEvent && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                  >
                    Delete
                  </button>
                )}
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors"
                >
                  {selectedEvent ? 'Save' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chore Action Modal */}
      {selectedChore && (
        <ChoreActionModal
          chore={selectedChore}
          onClose={() => setSelectedChore(null)}
          onComplete={() => {
            handleCompleteChore(selectedChore);
            setSelectedChore(null);
          }}
          onSkip={() => {
            handleSkipChore(selectedChore);
            setSelectedChore(null);
          }}
        />
      )}
    </div>
  );
}

// =============================================================================
// Day Detail Modal
// =============================================================================
function DayDetailModal({
  date,
  events,
  chores,
  onClose,
  onNewEvent,
  onEditEvent,
  onCompleteChore,
  onSkipChore,
  formatTime,
  formatFullDate,
}: {
  date: Date;
  events: CalendarEvent[];
  chores: ChoreInstance[];
  onClose: () => void;
  onNewEvent: () => void;
  onEditEvent: (event: CalendarEvent) => void;
  onCompleteChore: (chore: ChoreInstance) => void;
  onSkipChore: (chore: ChoreInstance) => void;
  formatTime: (dateStr: string) => string;
  formatFullDate: (date: Date) => string;
}) {
  const isTodayDate = (d: Date) => {
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-hidden flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {isTodayDate(date) ? 'Today' : formatFullDate(date)}
            </h2>
            {isTodayDate(date) && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{formatFullDate(date)}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Events Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Calendar size={16} />
                Events ({events.length})
              </h3>
              <button
                onClick={onNewEvent}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
              >
                <Plus size={14} />
                Add Event
              </button>
            </div>

            {events.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">
                No events scheduled
              </p>
            ) : (
              <div className="space-y-2">
                {events.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => onEditEvent(event)}
                    className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: event.color || '#3b82f6' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {event.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {!event.allDay && (
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {formatTime(event.start)}
                              {event.end && ` - ${formatTime(event.end)}`}
                            </span>
                          )}
                          {event.allDay && <span>All day</span>}
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin size={12} />
                              {event.location}
                            </span>
                          )}
                        </div>
                        {event.assignedToName && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Assigned to: {event.assignedToName}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chores Section */}
          {chores.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                <CheckSquare size={16} />
                Chores ({chores.length})
              </h3>
              <div className="space-y-2">
                {chores.map((chore) => {
                  const isCompleted = chore.status === 'completed' || chore.status === 'approved';
                  const isPending = chore.status === 'pending';

                  return (
                    <div
                      key={chore.id}
                      className={`p-3 rounded-xl border transition-colors ${
                        isCompleted
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: chore.categoryColor || '#8b5cf6' }}
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-medium ${isCompleted ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-gray-100'}`}
                          >
                            {chore.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                            <span>{chore.points} pts</span>
                            {chore.assignedToName && <span>• {chore.assignedToName}</span>}
                          </div>
                        </div>

                        {isPending && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => onCompleteChore(chore)}
                              className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                              title="Complete"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => onSkipChore(chore)}
                              className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
                              title="Skip"
                            >
                              <SkipForward size={16} />
                            </button>
                          </div>
                        )}

                        {isCompleted && (
                          <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                            ✓ Done
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Chore Action Modal
// =============================================================================
function ChoreActionModal({
  chore,
  onClose,
  onComplete,
  onSkip,
}: {
  chore: ChoreInstance;
  onClose: () => void;
  onComplete: () => void;
  onSkip: () => void;
}) {
  const isCompleted = chore.status === 'completed' || chore.status === 'approved';
  const isPending = chore.status === 'pending';

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const normalized = dateStr.substring(0, 10);
    const [year, month, day] = normalized.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6 m-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Chore Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: chore.categoryColor || '#8b5cf6' }}
            >
              <CheckSquare className="text-white" size={16} />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">{chore.title}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{chore.points} points</p>
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
            <p>
              <strong>Due:</strong> {formatDate(chore.dueDate)}
            </p>
            {chore.assignedToName && (
              <p>
                <strong>Assigned to:</strong> {chore.assignedToName}
              </p>
            )}
            <p>
              <strong>Status:</strong>{' '}
              <span
                className={
                  isCompleted
                    ? 'text-green-600 dark:text-green-400'
                    : chore.status === 'pending'
                      ? 'text-purple-600 dark:text-purple-400'
                      : 'text-gray-600 dark:text-gray-400'
                }
              >
                {chore.status}
              </span>
            </p>
          </div>
        </div>

        {isPending && (
          <div className="space-y-2">
            <button
              onClick={onComplete}
              className="w-full p-3 text-left rounded-xl border border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors flex items-center gap-3"
            >
              <Check className="text-green-600 dark:text-green-400" size={20} />
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Mark Complete</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Complete this chore and earn {chore.points} points
                </p>
              </div>
            </button>

            <button
              onClick={onSkip}
              className="w-full p-3 text-left rounded-xl border border-gray-200 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors flex items-center gap-3"
            >
              <SkipForward className="text-orange-600 dark:text-orange-400" size={20} />
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Skip</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Skip this occurrence (no points)
                </p>
              </div>
            </button>
          </div>
        )}

        {isCompleted && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-green-700 dark:text-green-400 text-center">
            <Check className="inline mr-2" size={16} />
            This chore has been completed
            {chore.pointsAwarded && ` (+${chore.pointsAwarded} points)`}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
