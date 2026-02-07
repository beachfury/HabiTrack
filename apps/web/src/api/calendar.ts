// apps/web/src/api/calendar.ts
// Calendar API endpoints

import { apiClient } from './client';
import type { CalendarEvent, CreateEventData, UpdateEventData } from '../types';

export const calendarApi = {
  // Get events for a date range
  getEvents(startDate: string, endDate: string): Promise<{ events: CalendarEvent[] }> {
    return apiClient['get'](`/calendar/events?start=${startDate}&end=${endDate}`, {
      params: undefined,
    });
  },

  // Get single event
  getEvent(id: number): Promise<{ event: CalendarEvent }> {
    return apiClient['get'](`/calendar/events/${id}`, { params: undefined });
  },

  // Create event
  createEvent(data: CreateEventData): Promise<{ id: number; event: CalendarEvent }> {
    return apiClient['post']('/calendar/events', data);
  },

  // Update event
  updateEvent(id: number, data: UpdateEventData): Promise<{ success: boolean }> {
    return apiClient['put'](`/calendar/events/${id}`, data);
  },

  // Delete event
  deleteEvent(id: number): Promise<{ success: boolean }> {
    return apiClient['delete'](`/calendar/events/${id}`, undefined);
  },

  // Get today's events
  getTodayEvents(): Promise<{ events: CalendarEvent[] }> {
    const today = new Date().toISOString().split('T')[0];
    return calendarApi.getEvents(today, today);
  },

  // Get this week's events
  getWeekEvents(): Promise<{ events: CalendarEvent[] }> {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    return calendarApi.getEvents(
      startOfWeek.toISOString().split('T')[0],
      endOfWeek.toISOString().split('T')[0],
    );
  },

  // Get this month's events
  getMonthEvents(year: number, month: number): Promise<{ events: CalendarEvent[] }> {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    return calendarApi.getEvents(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
    );
  },

  // Get users for calendar assignment dropdown
  getCalendarUsers(): Promise<{
    users: Array<{
      id: number;
      displayName: string;
      nickname: string | null;
      roleId: string;
      color: string | null;
    }>;
  }> {
    return apiClient['get']('/calendar/users', { params: undefined });
  },
};
