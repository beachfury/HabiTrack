// apps/web/src/pages/CalendarPage.tsx
// Main calendar page with month view, events, and chores

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckSquare,
  User,
} from 'lucide-react';
import { api, type CalendarEvent, type CreateEventData, type ChoreInstance } from '../api';
import { mealsApi } from '../api/meals';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import type { MealPlan } from '../types/meals';
import { ModalPortal, ModalBody } from '../components/common/ModalPortal';
import { normalizeDate, formatDateLocal, formatDateTimeLocal, EVENT_COLORS, DAYS_SHORT, MONTHS } from '../utils';

// Import split components
import { DayDetailModal, ChoreActionModal, WeeklyMealCard, UserDayCard } from './calendar';
import type { CalendarUser } from './calendar';

// Use constants from utils
const DAYS = DAYS_SHORT;
const COLORS = EVENT_COLORS;

export function CalendarPage() {
  const { user } = useAuth();
  const { getPageAnimationClasses } = useTheme();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get animation classes for the calendar page background
  const animationClasses = getPageAnimationClasses('calendar-background');
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
    <div className={`min-h-screen themed-calendar-bg ${animationClasses}`}>
      <div className="p-3 sm:p-4 md:p-6 lg:p-8 flex flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between mb-6">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <h1 className="themed-calendar-title">
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
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
        {/* Day headers - use inherit for font styles from themed container */}
        <div className="grid grid-cols-7" style={{ borderBottom: '1px solid var(--calendar-grid-border, rgba(255,255,255,0.15))' }}>
          {DAYS.map((day) => (
            <div
              key={day}
              className="py-2 sm:py-3 text-center text-xs sm:text-sm"
              style={{
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
                  className="border-b border-r"
                  style={{ borderColor: 'var(--calendar-grid-border, rgba(255,255,255,0.1))' }}
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
                className={`border-b border-r p-1 cursor-pointer hover:bg-[var(--color-muted)]/50 transition-colors min-h-[100px] ${
                  !inCurrentMonth ? 'bg-[var(--color-muted)]/30' : ''
                }`}
                style={{ borderColor: 'var(--calendar-grid-border, rgba(255,255,255,0.1))' }}
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
      <ModalPortal
        isOpen={showEventModal}
        onClose={closeModals}
        title={selectedEvent ? 'Edit Event' : 'New Event'}
        size="md"
        className="themed-card"
      >
        <ModalBody>
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
        </ModalBody>
      </ModalPortal>

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
    </div>
  );
}
