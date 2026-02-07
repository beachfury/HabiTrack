// apps/web/src/api/dashboard.ts
// Frontend API client for Dashboard widgets

const API_BASE = '/api';

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// =============================================================================
// TYPES
// =============================================================================

export interface Widget {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  category: string;
  defaultW: number;
  defaultH: number;
  minW: number;
  minH: number;
  maxW: number | null;
  maxH: number | null;
  defaultConfig: any;
  roles: string | null;
  active: boolean;
}

export interface WidgetLayout {
  widgetId: string;
  name: string;
  description: string | null;
  icon: string | null;
  category: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW: number | null;
  minH: number | null;
  maxW: number | null;
  maxH: number | null;
  visible: boolean;
  config: any;
}

export interface DashboardWidget {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  category: string;
  defaultW: number;
  defaultH: number;
  minW: number;
  minH: number;
  maxW: number | null;
  maxH: number | null;
}

export interface DashboardData {
  user?: {
    displayName: string;
  };
  quickStats?: {
    events: number;
    chores: number;
    shopping: number;
    paidChores?: number;
  };
  todaysEvents?: Array<{
    id: number;
    title: string;
    startTime: string;
    endTime: string;
    color: string;
    allDay: boolean;
  }>;
  upcomingEvents?: Array<{
    id: number;
    title: string;
    startTime: string;
    endTime: string;
    color: string;
    allDay: boolean;
  }>;
  todaysChores?: Array<{
    id: number;
    choreId: number;
    title: string;
    status: string;
    dueDate: string;
    completedAt: string | null;
    assigneeName: string;
    assigneeColor: string;
  }>;
  myChores?: Array<{
    id: number;
    choreId: number;
    title: string;
    status: string;
    dueDate: string;
    completedAt: string | null;
  }>;
  shoppingItems?: Array<{
    id: number;
    name: string;
    quantity: number;
    unit: string | null;
    purchased: boolean;
    categoryName: string;
  }>;
  choreLeaderboard?: Array<{
    id: number;
    displayName: string;
    color: string;
    avatarUrl: string | null;
    points: number;
  }>;
  availablePaidChores?: Array<{
    id: string;
    title: string;
    amount: number;
    difficulty: string;
    status: string;
  }>;
  myEarnings?: {
    total: number;
    pending: number;
    thisWeek: number;
  };
  familyMembers?: Array<{
    id: number;
    displayName: string;
    nickname: string | null;
    color: string;
    avatarUrl: string | null;
    role: string;
  }>;
  announcements?: Array<{
    id: number;
    title: string;
    content: string;
    createdAt: string;
    sender: {
      displayName: string;
      color: string;
    };
    isRead: boolean;
  }>;
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

async function getAvailableWidgets(): Promise<DashboardWidget[]> {
  const response = await fetchApi<{ widgets: DashboardWidget[] }>('/dashboard/widgets');
  return response.widgets;
}

async function getLayout(): Promise<WidgetLayout[]> {
  const response = await fetchApi<{ layout: WidgetLayout[]; isDefault: boolean }>('/dashboard/layout');
  return response.layout;
}

async function saveLayout(layout: WidgetLayout[]): Promise<void> {
  await fetchApi<{ success: boolean }>('/dashboard/layout', {
    method: 'PUT',
    body: JSON.stringify({ layout }),
  });
}

async function addWidget(widgetId: string, position?: { x: number; y: number; w: number; h: number }): Promise<WidgetLayout> {
  await fetchApi<{ success: boolean }>('/dashboard/widgets', {
    method: 'POST',
    body: JSON.stringify({ widgetId, ...position }),
  });

  // Return a default layout for the new widget
  return {
    widgetId,
    name: widgetId,
    description: null,
    icon: null,
    category: 'general',
    x: position?.x || 0,
    y: position?.y || 0,
    w: position?.w || 2,
    h: position?.h || 2,
    minW: 1,
    minH: 1,
    maxW: null,
    maxH: null,
    visible: true,
    config: {},
  };
}

async function removeWidget(widgetId: string): Promise<void> {
  await fetchApi<{ success: boolean }>(`/dashboard/widgets/${encodeURIComponent(widgetId)}`, {
    method: 'DELETE',
  });
}

async function updateWidgetConfig(widgetId: string, config: any): Promise<void> {
  await fetchApi<{ success: boolean }>(`/dashboard/widgets/${encodeURIComponent(widgetId)}/config`, {
    method: 'PUT',
    body: JSON.stringify({ config }),
  });
}

async function resetDashboard(): Promise<WidgetLayout[]> {
  await fetchApi<{ success: boolean }>('/dashboard/reset', {
    method: 'POST',
  });
  // Reload layout after reset
  return getLayout();
}

async function getDashboardData(): Promise<DashboardData> {
  const data = await fetchApi<any>('/dashboard/data');

  // Transform backend data to match widget props
  return {
    user: { displayName: data.user?.displayName || 'User' },
    quickStats: {
      events: data.todaysEvents?.length || 0,
      chores: data.todaysChores?.length || 0,
      shopping: data.shoppingItems?.length || 0,
      paidChores: data.paidChores?.length || 0,
    },
    todaysEvents: data.todaysEvents || [],
    upcomingEvents: data.upcomingEvents || [],
    todaysChores: data.todaysChores || [],
    myChores: data.myChores || [],
    shoppingItems: data.shoppingItems || [],
    choreLeaderboard: data.choreLeaderboard || [],
    availablePaidChores: data.paidChores || [],
    myEarnings: {
      total: Number(data.earnings) || 0,
      pending: 0,
      thisWeek: 0,
    },
    familyMembers: data.familyMembers || [],
    announcements: (data.announcements || []).map((a: any) => ({
      id: a.id,
      title: a.title,
      content: a.body,
      createdAt: a.createdAt,
      sender: {
        displayName: a.fromUserName || 'System',
        color: '#8b5cf6',
      },
      isRead: false,
    })),
  };
}

// Export as object for use in components
export const dashboardApi = {
  getAvailableWidgets,
  getLayout,
  saveLayout,
  addWidget,
  removeWidget,
  updateWidgetConfig,
  resetDashboard,
  getDashboardData,
};
