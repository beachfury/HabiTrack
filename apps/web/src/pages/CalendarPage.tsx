import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Utensils,
  User,
} from 'lucide-react';
import { api, type CalendarEvent, type CreateEventData, type ChoreInstance } from '../api';
import { mealsApi } from '../api/meals';
import { useAuth } from '../context/AuthContext';
import type { MealPlan } from '../types/meals';

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
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [chores, setChores] = useState<ChoreInstance[]>([]);
  const [users, setUsers] = useState<CalendarUser[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
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

  // Fetch events, chores, users, and meal plans when month changes
  useEffect(() => {
    // Clear existing data immediately to prevent stale data flash
    setEvents([]);
    setChores([]);
    setMealPlans([]);
    setLoading(true);

    fetchEvents();
    fetchChores();
    fetchUsers();
    fetchMealPlans();
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

  const fetchMealPlans = async () => {
    try {
      // Get current week's start and end
      const today = new Date();
      const dayOfWeek = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const startStr = formatDateLocal(startOfWeek);
      const endStr = formatDateLocal(endOfWeek);

      const data = await mealsApi.getMealPlans({ startDate: startStr, endDate: endStr });
      setMealPlans(data.mealPlans);
    } catch (err) {
      console.error('Failed to fetch meal plans:', err);
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
        // Only update regular events (not meal plans which have string IDs like "meal-123")
        if (typeof selectedEvent.id === 'number') {
          await api.updateEvent(selectedEvent.id, submitData);
        }
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
    // Only delete regular events (not meal plans which have string IDs like "meal-123")
    if (typeof selectedEvent.id !== 'number') return;

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
    <div className="p-8 h-full flex flex-col themed-calendar-bg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-[var(--color-foreground)]">
            {MONTHS[month]} {year}
          </h1>
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-[var(--color-muted)] rounded-lg transition-colors"
            >
              <ChevronLeft size={20} className="text-[var(--color-muted-foreground)]" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-[var(--color-muted)] rounded-lg transition-colors"
            >
              <ChevronRight size={20} className="text-[var(--color-muted-foreground)]" />
            </button>
          </div>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-lg transition-colors"
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
                ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]/80'
            }`}
          >
            <CheckSquare size={16} />
            Chores
          </button>
          <button
            onClick={() => openNewEventModal(new Date())}
            className="themed-btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Add Event
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 themed-calendar-grid overflow-hidden flex flex-col">
        {/* Day headers - use inherit for font styles from themed container */}
        <div className="grid grid-cols-7 border-b border-[var(--color-border)]">
          {DAYS.map((day) => (
            <div
              key={day}
              className="py-3 text-center"
              style={{
                fontSize: 'var(--calendar-grid-font-size, 0.875rem)',
                fontWeight: 'var(--calendar-grid-font-weight, 600)',
                fontFamily: 'var(--calendar-grid-font-family, inherit)',
                color: 'var(--calendar-grid-text, var(--color-muted-foreground))',
              }}
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
                  className="border-b border-r border-[var(--color-border)]/30"
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
                className={`border-b border-r border-[var(--color-border)]/30 p-1 cursor-pointer hover:bg-[var(--color-muted)]/50 transition-colors min-h-[100px] ${
                  !inCurrentMonth ? 'bg-[var(--color-muted)]/30' : ''
                }`}
              >
                <div className="flex items-center justify-center mb-1">
                  <span
                    className="w-7 h-7 flex items-center justify-center rounded-full"
                    style={{
                      fontSize: 'var(--calendar-grid-font-size, 0.875rem)',
                      fontFamily: 'var(--calendar-grid-font-family, inherit)',
                      fontWeight: isCurrentDay ? 700 : 'var(--calendar-grid-font-weight, 400)',
                      backgroundColor: isCurrentDay ? 'var(--color-primary)' : 'transparent',
                      color: isCurrentDay
                        ? 'var(--color-primary-foreground)'
                        : inCurrentMonth
                          ? 'var(--calendar-grid-text, var(--color-foreground))'
                          : 'var(--color-muted-foreground)',
                    }}
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
                          // Handle meal plan events differently
                          if (event.isMealPlan) {
                            const mealDate = event.start.split('T')[0];
                            navigate(`/meals?date=${mealDate}`);
                          } else {
                            openEditEventModal(event);
                          }
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
                            ? 'bg-[var(--color-success)]/10 text-[var(--color-success)] line-through'
                            : chore.status === 'pending'
                              ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                              : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'
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
                    <div className="text-xs text-[var(--color-muted-foreground)] px-2">
                      +{totalItems - maxDisplay} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Section: Weekly Meals & User Cards */}
      <div className="mt-6 space-y-6">
        {/* Weekly Meal Planner */}
        <WeeklyMealCard
          mealPlans={mealPlans}
          onMealClick={(date) => navigate(`/meals?date=${date}`)}
        />

        {/* User Daily Cards */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <User size={18} className="text-[var(--color-primary)]" />
            <h3 className="font-semibold text-[var(--color-foreground)]">Today's Schedule by Member</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {(user?.role === 'admin' ? users : users.filter((u) => u.id === user?.id)).map((member) => {
              const today = new Date();
              const todayEvents = getEventsForDay(today);
              const todayChores = getChoresForDay(today);
              return (
                <UserDayCard
                  key={member.id}
                  user={member}
                  events={todayEvents}
                  chores={todayChores}
                  date={today}
                  isCurrentUser={member.id === user?.id}
                />
              );
            })}
          </div>
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
          <div className="themed-card w-full max-w-md p-6 max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[var(--color-foreground)]">
                {selectedEvent ? 'Edit Event' : 'New Event'}
              </h2>
              <button
                onClick={closeModals}
                className="p-2 hover:bg-[var(--color-muted)] rounded-lg transition-colors"
              >
                <X size={20} className="text-[var(--color-muted-foreground)]" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="themed-input w-full"
                  placeholder="Event title"
                  required
                />
              </div>

              {/* Assigned To - Only show dropdown for admins */}
              {canAssignToOthers && (
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
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
                    className="themed-input w-full"
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
                  className="w-4 h-4 text-[var(--color-primary)] rounded focus:ring-[var(--color-primary)]"
                />
                <label htmlFor="allDay" className="text-sm text-[var(--color-foreground)]">
                  All day event
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  {formData.allDay ? 'Date' : 'Start'}
                </label>
                <input
                  type={formData.allDay ? 'date' : 'datetime-local'}
                  value={formData.allDay ? formData.start.slice(0, 10) : formData.start}
                  onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                  className="themed-input w-full"
                  required
                />
              </div>

              {!formData.allDay && (
                <div>
                  <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                    End (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.end}
                    onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                    className="themed-input w-full"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="themed-input w-full"
                  placeholder="Event location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="themed-input w-full"
                  placeholder="Event description"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">
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
                          ? 'ring-2 ring-offset-2 ring-[var(--color-border)] scale-110'
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
                    className="px-4 py-2 text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 rounded-xl transition-colors"
                  >
                    Delete
                  </button>
                )}
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={closeModals}
                  className="themed-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="themed-btn-primary"
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
      <div className="themed-card w-full max-w-lg p-6 max-h-[90vh] overflow-hidden flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-[var(--color-foreground)]">
              {isTodayDate(date) ? 'Today' : formatFullDate(date)}
            </h2>
            {isTodayDate(date) && (
              <p className="text-sm text-[var(--color-muted-foreground)]">{formatFullDate(date)}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--color-muted)] rounded-lg"
          >
            <X size={20} className="text-[var(--color-muted-foreground)]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Events Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-[var(--color-foreground)] flex items-center gap-2">
                <Calendar size={16} />
                Events ({events.length})
              </h3>
              <button
                onClick={onNewEvent}
                className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary)]/80 font-medium flex items-center gap-1"
              >
                <Plus size={14} />
                Add Event
              </button>
            </div>

            {events.length === 0 ? (
              <p className="text-sm text-[var(--color-muted-foreground)] py-4 text-center">
                No events scheduled
              </p>
            ) : (
              <div className="space-y-2">
                {events.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => onEditEvent(event)}
                    className="p-3 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-border)]/80 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: event.color || '#3b82f6' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[var(--color-foreground)]">
                          {event.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-[var(--color-muted-foreground)]">
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
                          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
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
              <h3 className="text-sm font-medium text-[var(--color-foreground)] flex items-center gap-2 mb-2">
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
                          ? 'bg-[var(--color-success)]/10 border-[var(--color-success)]/30'
                          : 'border-[var(--color-border)]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: chore.categoryColor || '#8b5cf6' }}
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-medium ${isCompleted ? 'text-[var(--color-muted-foreground)] line-through' : 'text-[var(--color-foreground)]'}`}
                          >
                            {chore.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-sm text-[var(--color-muted-foreground)]">
                            <span>{chore.points} pts</span>
                            {chore.assignedToName && <span>• {chore.assignedToName}</span>}
                          </div>
                        </div>

                        {isPending && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => onCompleteChore(chore)}
                              className="p-2 bg-[var(--color-success)]/10 text-[var(--color-success)] rounded-lg hover:bg-[var(--color-success)]/20 transition-colors"
                              title="Complete"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => onSkipChore(chore)}
                              className="p-2 bg-[var(--color-warning)]/10 text-[var(--color-warning)] rounded-lg hover:bg-[var(--color-warning)]/20 transition-colors"
                              title="Skip"
                            >
                              <SkipForward size={16} />
                            </button>
                          </div>
                        )}

                        {isCompleted && (
                          <span className="text-[var(--color-success)] text-sm font-medium">
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
        <div className="pt-4 mt-4 border-t border-[var(--color-border)]">
          <button
            onClick={onClose}
            className="w-full themed-btn-secondary"
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
      <div className="themed-card w-full max-w-sm p-6 m-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Chore Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--color-muted)] rounded-lg"
          >
            <X size={20} className="text-[var(--color-muted-foreground)]" />
          </button>
        </div>

        <div className="mb-4 p-4 bg-[var(--color-muted)]/50 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: chore.categoryColor || '#8b5cf6' }}
            >
              <CheckSquare className="text-white" size={16} />
            </div>
            <div>
              <p className="font-medium text-[var(--color-foreground)]">{chore.title}</p>
              <p className="text-sm text-[var(--color-muted-foreground)]">{chore.points} points</p>
            </div>
          </div>
          <div className="text-sm text-[var(--color-foreground)] space-y-1 mt-3 pt-3 border-t border-[var(--color-border)]">
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
                    ? 'text-[var(--color-success)]'
                    : chore.status === 'pending'
                      ? 'text-[var(--color-primary)]'
                      : 'text-[var(--color-muted-foreground)]'
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
              className="w-full p-3 text-left rounded-xl border border-[var(--color-border)] hover:border-[var(--color-success)]/50 hover:bg-[var(--color-success)]/10 transition-colors flex items-center gap-3"
            >
              <Check className="text-[var(--color-success)]" size={20} />
              <div>
                <p className="font-medium text-[var(--color-foreground)]">Mark Complete</p>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Complete this chore and earn {chore.points} points
                </p>
              </div>
            </button>

            <button
              onClick={onSkip}
              className="w-full p-3 text-left rounded-xl border border-[var(--color-border)] hover:border-[var(--color-warning)]/50 hover:bg-[var(--color-warning)]/10 transition-colors flex items-center gap-3"
            >
              <SkipForward className="text-[var(--color-warning)]" size={20} />
              <div>
                <p className="font-medium text-[var(--color-foreground)]">Skip</p>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Skip this occurrence (no points)
                </p>
              </div>
            </button>
          </div>
        )}

        {isCompleted && (
          <div className="p-3 bg-[var(--color-success)]/10 rounded-xl text-[var(--color-success)] text-center">
            <Check className="inline mr-2" size={16} />
            This chore has been completed
            {chore.pointsAwarded && ` (+${chore.pointsAwarded} points)`}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-4 themed-btn-secondary"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// Weekly Meal Planner Card (Read-only)
// =============================================================================
function WeeklyMealCard({
  mealPlans,
  onMealClick,
}: {
  mealPlans: MealPlan[];
  onMealClick: (date: string) => void;
}) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    weekDays.push(date);
  }

  const getMealForDate = (date: Date) => {
    const dateStr = formatDateLocal(date);
    return mealPlans.find((mp) => mp.date === dateStr);
  };

  const getMealDisplay = (meal: MealPlan | undefined) => {
    if (!meal) return { text: 'Not planned', icon: '📭', style: 'text-[var(--color-muted-foreground)]' };
    if (meal.isFendForYourself) return { text: 'Fend For Yourself', icon: '🍕', style: 'text-[var(--color-warning)]' };
    if (meal.status === 'voting') return { text: 'Voting Open', icon: '🗳️', style: 'text-[var(--color-primary)]' };
    if (meal.recipe?.name) return { text: meal.recipe.name, icon: '🍽️', style: 'text-[var(--color-foreground)]' };
    if (meal.customMealName) return { text: meal.customMealName, icon: '🍽️', style: 'text-[var(--color-foreground)]' };
    return { text: 'Planned', icon: '📅', style: 'text-[var(--color-muted-foreground)]' };
  };

  const isToday = (date: Date) => {
    const todayStr = formatDateLocal(new Date());
    return formatDateLocal(date) === todayStr;
  };

  return (
    <div className="themed-calendar-meal p-4">
      <div className="flex items-center gap-2 mb-4">
        <Utensils size={18} className="text-[var(--color-primary)]" />
        <h3
          style={{
            fontWeight: 'var(--calendar-meal-font-weight, 600)',
            fontSize: 'var(--calendar-meal-font-size, 1rem)',
            fontFamily: 'var(--calendar-meal-font-family, inherit)',
            color: 'var(--calendar-meal-text, var(--color-foreground))',
          }}
        >
          Weekly Meal Plan
        </h3>
      </div>
      <div
        className="grid grid-cols-7 gap-2"
        style={{ fontFamily: 'var(--calendar-meal-font-family, inherit)' }}
      >
        {weekDays.map((date, i) => {
          const meal = getMealForDate(date);
          const display = getMealDisplay(meal);
          const dayIsToday = isToday(date);

          return (
            <div
              key={i}
              onClick={() => onMealClick(formatDateLocal(date))}
              className={`p-2 rounded-lg cursor-pointer transition-colors hover:bg-[var(--color-muted)]/50 ${
                dayIsToday ? 'bg-[var(--color-primary)]/10 ring-1 ring-[var(--color-primary)]' : ''
              }`}
            >
              <div className="text-center mb-1">
                <span
                  style={{
                    fontSize: 'calc(var(--calendar-meal-font-size, 0.75rem) * 0.85)',
                    fontWeight: 'var(--calendar-meal-font-weight, 400)',
                    color: 'var(--color-muted-foreground)',
                  }}
                >
                  {DAYS[date.getDay()]}
                </span>
                <span
                  className="block"
                  style={{
                    fontSize: 'var(--calendar-meal-font-size, 0.875rem)',
                    fontWeight: 'var(--calendar-meal-font-weight, 500)',
                    color: dayIsToday ? 'var(--color-primary)' : 'var(--calendar-meal-text, var(--color-foreground))',
                  }}
                >
                  {date.getDate()}
                </span>
              </div>
              <div className="text-center">
                <span style={{ fontSize: 'var(--calendar-meal-font-size, 1.125rem)' }}>{display.icon}</span>
                <p
                  className="truncate"
                  style={{
                    fontSize: 'calc(var(--calendar-meal-font-size, 0.75rem) * 0.85)',
                    fontWeight: 'var(--calendar-meal-font-weight, 400)',
                  }}
                  title={display.text}
                >
                  {display.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// User Day Card (Shows events/chores for a specific user)
// =============================================================================
function UserDayCard({
  user,
  events,
  chores,
  date,
  isCurrentUser,
}: {
  user: CalendarUser;
  events: CalendarEvent[];
  chores: ChoreInstance[];
  date: Date;
  isCurrentUser: boolean;
}) {
  // Filter events and chores for this specific user
  const userEvents = events.filter((e) => e.assignedTo === user.id);
  const userChores = chores.filter((c) => c.assignedTo === user.id);

  const totalItems = userEvents.length + userChores.length;

  if (totalItems === 0) {
    return (
      <div className={`themed-calendar-user p-4 ${isCurrentUser ? 'ring-2 ring-[var(--color-primary)]' : ''}`}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white"
            style={{
              backgroundColor: user.color || '#8b5cf6',
              fontSize: 'calc(var(--calendar-user-font-size, 0.875rem) * 0.9)',
              fontWeight: 'var(--calendar-user-font-weight, 500)',
            }}
          >
            {(user.nickname || user.displayName).charAt(0).toUpperCase()}
          </div>
          <div style={{ fontFamily: 'var(--calendar-user-font-family, inherit)' }}>
            <p
              style={{
                fontWeight: 'var(--calendar-user-font-weight, 500)',
                fontSize: 'var(--calendar-user-font-size, inherit)',
                color: 'var(--calendar-user-text, var(--color-foreground))',
              }}
            >
              {user.nickname || user.displayName}
              {isCurrentUser && (
                <span
                  className="ml-1"
                  style={{
                    fontSize: 'calc(var(--calendar-user-font-size, 0.75rem) * 0.85)',
                    color: 'var(--color-primary)',
                  }}
                >
                  (You)
                </span>
              )}
            </p>
            <p
              style={{
                fontSize: 'calc(var(--calendar-user-font-size, 0.75rem) * 0.85)',
                fontWeight: 'var(--calendar-user-font-weight, 400)',
                color: 'var(--color-muted-foreground)',
              }}
            >
              {user.roleId}
            </p>
          </div>
        </div>
        <p
          className="text-center py-2"
          style={{
            fontSize: 'var(--calendar-user-font-size, 0.875rem)',
            fontWeight: 'var(--calendar-user-font-weight, 400)',
            color: 'var(--color-muted-foreground)',
          }}
        >
          No events or chores for today
        </p>
      </div>
    );
  }

  return (
    <div className={`themed-calendar-user p-4 ${isCurrentUser ? 'ring-2 ring-[var(--color-primary)]' : ''}`}>
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white"
          style={{
            backgroundColor: user.color || '#8b5cf6',
            fontSize: 'calc(var(--calendar-user-font-size, 0.875rem) * 0.9)',
            fontWeight: 'var(--calendar-user-font-weight, 500)',
          }}
        >
          {(user.nickname || user.displayName).charAt(0).toUpperCase()}
        </div>
        <div className="flex-1" style={{ fontFamily: 'var(--calendar-user-font-family, inherit)' }}>
          <p
            style={{
              fontWeight: 'var(--calendar-user-font-weight, 500)',
              fontSize: 'var(--calendar-user-font-size, inherit)',
              color: 'var(--calendar-user-text, var(--color-foreground))',
            }}
          >
            {user.nickname || user.displayName}
            {isCurrentUser && (
              <span
                className="ml-1"
                style={{
                  fontSize: 'calc(var(--calendar-user-font-size, 0.75rem) * 0.85)',
                  color: 'var(--color-primary)',
                }}
              >
                (You)
              </span>
            )}
          </p>
          <p
            style={{
              fontSize: 'calc(var(--calendar-user-font-size, 0.75rem) * 0.85)',
              fontWeight: 'var(--calendar-user-font-weight, 400)',
              color: 'var(--color-muted-foreground)',
            }}
          >
            {user.roleId}
          </p>
        </div>
        <div className="text-right">
          <span
            style={{
              fontSize: 'var(--calendar-user-font-size, 0.875rem)',
              fontWeight: 'var(--calendar-user-font-weight, 500)',
              color: 'var(--calendar-user-text, var(--color-foreground))',
            }}
          >
            {totalItems}
          </span>
          <span
            className="ml-1"
            style={{
              fontSize: 'calc(var(--calendar-user-font-size, 0.75rem) * 0.85)',
              color: 'var(--color-muted-foreground)',
            }}
          >
            items
          </span>
        </div>
      </div>

      <div
        className="space-y-2 max-h-32 overflow-y-auto"
        style={{ fontFamily: 'var(--calendar-user-font-family, inherit)' }}
      >
        {/* Events */}
        {userEvents.map((event) => (
          <div
            key={`event-${event.id}`}
            className="flex items-center gap-2 p-2 rounded-lg bg-[var(--color-muted)]/30"
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: event.color || '#3b82f6' }}
            />
            <div className="flex-1 min-w-0">
              <p
                className="truncate"
                style={{
                  fontSize: 'var(--calendar-user-font-size, 0.875rem)',
                  fontWeight: 'var(--calendar-user-font-weight, 400)',
                  color: 'var(--calendar-user-text, var(--color-foreground))',
                }}
              >
                {event.title}
              </p>
              {!event.allDay && (
                <p
                  style={{
                    fontSize: 'calc(var(--calendar-user-font-size, 0.75rem) * 0.85)',
                    color: 'var(--color-muted-foreground)',
                  }}
                >
                  {new Date(event.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </p>
              )}
            </div>
            <Calendar size={12} className="text-[var(--color-muted-foreground)]" />
          </div>
        ))}

        {/* Chores */}
        {userChores.map((chore) => {
          const isCompleted = chore.status === 'completed' || chore.status === 'approved';
          return (
            <div
              key={`chore-${chore.id}`}
              className={`flex items-center gap-2 p-2 rounded-lg ${
                isCompleted ? 'bg-[var(--color-success)]/10' : 'bg-[var(--color-muted)]/30'
              }`}
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: chore.categoryColor || '#8b5cf6' }}
              />
              <div className="flex-1 min-w-0">
                <p
                  className="truncate"
                  style={{
                    fontSize: 'var(--calendar-user-font-size, 0.875rem)',
                    fontWeight: 'var(--calendar-user-font-weight, 400)',
                    color: isCompleted ? 'var(--color-muted-foreground)' : 'var(--calendar-user-text, var(--color-foreground))',
                    textDecoration: isCompleted ? 'line-through' : 'none',
                  }}
                >
                  {chore.title}
                </p>
                <p
                  style={{
                    fontSize: 'calc(var(--calendar-user-font-size, 0.75rem) * 0.85)',
                    color: 'var(--color-muted-foreground)',
                  }}
                >
                  {chore.points} pts
                </p>
              </div>
              {isCompleted ? (
                <Check size={12} className="text-[var(--color-success)]" />
              ) : (
                <CheckSquare size={12} className="text-[var(--color-muted-foreground)]" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
