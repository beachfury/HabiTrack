// apps/api/src/routes/dashboard.ts
// Dashboard widgets API - user-customizable home page layouts

import { Request, Response } from 'express';
import { q } from '../db';
import { getUser } from '../utils/auth';
import { authRequired, invalidInput, notFound, serverError } from '../utils/errors';
import { LIMITS } from '../utils/constants';

// Widget type definitions
interface Widget {
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
  configSchema?: any;
  roles: string | null;
  active: boolean;
}

interface UserWidgetLayout {
  widgetId: string;
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

// Default widgets when table doesn't exist
const defaultWidgetsList: Widget[] = [
  { id: 'welcome', name: 'Welcome', description: 'Personalized greeting', icon: 'sparkles', category: 'general', defaultW: 4, defaultH: 1, minW: 2, minH: 1, maxW: null, maxH: null, defaultConfig: null, roles: null, active: true },
  { id: 'quick-stats', name: 'Quick Stats', description: 'Overview of events, chores, shopping', icon: 'bar-chart-3', category: 'general', defaultW: 4, defaultH: 1, minW: 2, minH: 1, maxW: null, maxH: null, defaultConfig: null, roles: null, active: true },
  { id: 'todays-events', name: "Today's Events", description: 'Calendar events for today', icon: 'calendar', category: 'calendar', defaultW: 2, defaultH: 2, minW: 1, minH: 2, maxW: null, maxH: null, defaultConfig: null, roles: null, active: true },
  { id: 'upcoming-events', name: 'Upcoming Events', description: 'Events for the next 7 days', icon: 'calendar', category: 'calendar', defaultW: 2, defaultH: 3, minW: 2, minH: 2, maxW: null, maxH: null, defaultConfig: null, roles: null, active: true },
  { id: 'todays-chores', name: "Today's Chores", description: 'Chores due today', icon: 'check-square', category: 'chores', defaultW: 2, defaultH: 2, minW: 1, minH: 2, maxW: null, maxH: null, defaultConfig: null, roles: null, active: true },
  { id: 'my-chores', name: 'My Chores', description: 'Your assigned chores', icon: 'list-checks', category: 'chores', defaultW: 2, defaultH: 2, minW: 1, minH: 2, maxW: null, maxH: null, defaultConfig: null, roles: null, active: true },
  { id: 'chore-leaderboard', name: 'Chore Leaderboard', description: 'Top performers this week', icon: 'trophy', category: 'chores', defaultW: 2, defaultH: 2, minW: 1, minH: 2, maxW: null, maxH: null, defaultConfig: null, roles: null, active: true },
  { id: 'shopping-list', name: 'Shopping List', description: 'Quick view of shopping items', icon: 'shopping-cart', category: 'shopping', defaultW: 2, defaultH: 2, minW: 1, minH: 2, maxW: null, maxH: null, defaultConfig: null, roles: null, active: true },
  { id: 'paid-chores', name: 'Paid Chores', description: 'Available paid chores to claim', icon: 'dollar-sign', category: 'finance', defaultW: 2, defaultH: 2, minW: 1, minH: 2, maxW: null, maxH: null, defaultConfig: null, roles: null, active: true },
  { id: 'earnings', name: 'My Earnings', description: 'Your paid chore earnings', icon: 'wallet', category: 'finance', defaultW: 2, defaultH: 1, minW: 1, minH: 1, maxW: null, maxH: null, defaultConfig: null, roles: null, active: true },
  { id: 'family-members', name: 'Family', description: 'Quick family member overview', icon: 'users', category: 'family', defaultW: 2, defaultH: 2, minW: 1, minH: 2, maxW: null, maxH: null, defaultConfig: null, roles: null, active: true },
  { id: 'announcements', name: 'Announcements', description: 'Recent announcements', icon: 'megaphone', category: 'messages', defaultW: 2, defaultH: 2, minW: 1, minH: 2, maxW: null, maxH: null, defaultConfig: null, roles: null, active: true },
  { id: 'weather', name: 'Weather', description: 'Local weather forecast', icon: 'cloud-sun', category: 'general', defaultW: 2, defaultH: 1, minW: 1, minH: 1, maxW: null, maxH: null, defaultConfig: null, roles: null, active: true },
  { id: 'upcoming-meals', name: 'Upcoming Meals', description: "This week's dinner plans", icon: 'utensils-crossed', category: 'meals', defaultW: 2, defaultH: 2, minW: 1, minH: 2, maxW: null, maxH: null, defaultConfig: null, roles: null, active: true },
];

// ============================================
// GET AVAILABLE WIDGETS
// ============================================
export async function getAvailableWidgets(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    let widgets: Widget[];
    try {
      widgets = await q<Widget[]>(`
        SELECT id, name, description, icon, category, defaultW, defaultH, minW, minH, maxW, maxH, defaultConfig, roles, active
        FROM dashboard_widgets
        WHERE active = 1
        ORDER BY sortOrder ASC
      `);
    } catch {
      // Table doesn't exist, use defaults
      widgets = defaultWidgetsList;
    }

    // Filter widgets based on user role
    const filteredWidgets = widgets.filter((w) => {
      if (!w.roles) return true;
      const allowedRoles = w.roles.split(',').map((r) => r.trim());
      return allowedRoles.includes(user.roleId);
    });

    res.json({ widgets: filteredWidgets });
  } catch (err) {
    console.error('Failed to get available widgets:', err);
    serverError(res, 'Failed to get available widgets');
  }
}

// ============================================
// GET USER'S DASHBOARD LAYOUT
// ============================================
export async function getDashboardLayout(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    // Try to get user's custom layout, handle table not existing
    let layouts: any[] = [];
    try {
      layouts = await q<any[]>(`
        SELECT ul.widgetId, ul.x, ul.y, ul.w, ul.h, ul.minW, ul.minH, ul.maxW, ul.maxH, ul.visible, ul.config,
               dw.name, dw.description, dw.icon, dw.category, dw.defaultConfig, dw.configSchema
        FROM user_dashboard_layouts ul
        JOIN dashboard_widgets dw ON ul.widgetId = dw.id
        WHERE ul.userId = ? AND dw.active = 1
        ORDER BY ul.y ASC, ul.x ASC
      `, [user.id]);
    } catch {
      // Tables don't exist, will use default layout
    }

    // If user has no layout, return default layout
    if (layouts.length === 0) {
      let defaultWidgets: Widget[];
      try {
        defaultWidgets = await q<Widget[]>(`
          SELECT id, name, description, icon, category, defaultW, defaultH, minW, minH, maxW, maxH, defaultConfig, configSchema, roles
          FROM dashboard_widgets
          WHERE active = 1
          ORDER BY sortOrder ASC
          LIMIT 8
        `);
      } catch {
        // Table doesn't exist, use defaults
        defaultWidgets = defaultWidgetsList.slice(0, 8);
      }

      // Create default layout positions
      const defaultLayout = createDefaultLayout(defaultWidgets, user.roleId);

      res.json({
        layout: defaultLayout,
        isDefault: true,
      });
      return;
    }

    // Merge widget info with user layout
    const layout = layouts.map((l) => ({
      widgetId: l.widgetId,
      name: l.name,
      description: l.description,
      icon: l.icon,
      category: l.category,
      x: l.x,
      y: l.y,
      w: l.w,
      h: l.h,
      minW: l.minW,
      minH: l.minH,
      maxW: l.maxW,
      maxH: l.maxH,
      visible: Boolean(l.visible),
      config: safeParseConfig(l.config) ?? safeParseConfig(l.defaultConfig) ?? {},
      configSchema: safeParseConfig(l.configSchema),
    }));

    res.json({
      layout,
      isDefault: false,
    });
  } catch (err) {
    console.error('Failed to get dashboard layout:', err);
    serverError(res, 'Failed to get dashboard layout');
  }
}

// Helper to safely parse JSON config — returns null for falsy/invalid input
function safeParseConfig(config: any): any {
  if (!config) return null;
  if (typeof config === 'object') return config;
  try {
    return JSON.parse(config);
  } catch {
    return null;
  }
}

// Helper to create default layout
function createDefaultLayout(widgets: Widget[], userRole: string): any[] {
  const filteredWidgets = widgets.filter((w) => {
    if (!w.roles) return true;
    const allowedRoles = w.roles.split(',').map((r) => r.trim());
    return allowedRoles.includes(userRole);
  });

  // Create a simple grid layout
  let x = 0;
  let y = 0;
  const cols = 4;

  return filteredWidgets.map((w) => {
    const item = {
      widgetId: w.id,
      name: w.name,
      description: w.description,
      icon: w.icon,
      category: w.category,
      x,
      y,
      w: w.defaultW,
      h: w.defaultH,
      minW: w.minW,
      minH: w.minH,
      maxW: w.maxW,
      maxH: w.maxH,
      visible: true,
      config: safeParseConfig(w.defaultConfig) ?? {},
      configSchema: safeParseConfig(w.configSchema),
    };

    // Move to next position
    x += w.defaultW;
    if (x >= cols) {
      x = 0;
      y += w.defaultH;
    }

    return item;
  });
}

// ============================================
// SAVE USER'S DASHBOARD LAYOUT
// ============================================
export async function saveDashboardLayout(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    const { layout } = req.body as { layout: UserWidgetLayout[] };

    if (!Array.isArray(layout)) {
      return invalidInput(res, 'Layout must be an array');
    }

    // Clear existing layout
    await q('DELETE FROM user_dashboard_layouts WHERE userId = ?', [user.id]);

    // Insert new layout
    for (const item of layout) {
      await q(`
        INSERT INTO user_dashboard_layouts (userId, widgetId, x, y, w, h, minW, minH, maxW, maxH, visible, config)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        user.id,
        item.widgetId,
        item.x,
        item.y,
        item.w,
        item.h,
        item.minW,
        item.minH,
        item.maxW,
        item.maxH,
        item.visible ? 1 : 0,
        item.config ? JSON.stringify(item.config) : null,
      ]);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Failed to save dashboard layout:', err);
    serverError(res, 'Failed to save dashboard layout');
  }
}

// ============================================
// ADD WIDGET TO DASHBOARD
// ============================================
export async function addWidget(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    const { widgetId } = req.body;

    // Get widget info
    const widgets = await q<Widget[]>('SELECT * FROM dashboard_widgets WHERE id = ? AND active = 1', [widgetId]);

    if (widgets.length === 0) {
      return notFound(res, 'Widget');
    }

    const widget = widgets[0];

    // Check role permissions
    if (widget.roles) {
      const allowedRoles = widget.roles.split(',').map((r) => r.trim());
      if (!allowedRoles.includes(user.roleId)) {
        return res.status(403).json({ error: 'Widget not available for your role' });
      }
    }

    // Find next available position
    const existing = await q<any[]>(`
      SELECT MAX(y + h) as maxY FROM user_dashboard_layouts WHERE userId = ?
    `, [user.id]);

    const y = existing[0]?.maxY || 0;

    // Insert widget
    await q(`
      INSERT INTO user_dashboard_layouts (userId, widgetId, x, y, w, h, minW, minH, maxW, maxH, visible)
      VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?, ?, 1)
      ON DUPLICATE KEY UPDATE visible = 1
    `, [user.id, widgetId, y, widget.defaultW, widget.defaultH, widget.minW, widget.minH, widget.maxW, widget.maxH]);

    res.json({ success: true });
  } catch (err) {
    console.error('Failed to add widget:', err);
    serverError(res, 'Failed to add widget');
  }
}

// ============================================
// REMOVE WIDGET FROM DASHBOARD
// ============================================
export async function removeWidget(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    const { widgetId } = req.params;

    await q('DELETE FROM user_dashboard_layouts WHERE userId = ? AND widgetId = ?', [user.id, widgetId]);

    res.json({ success: true });
  } catch (err) {
    console.error('Failed to remove widget:', err);
    serverError(res, 'Failed to remove widget');
  }
}

// ============================================
// UPDATE WIDGET CONFIG
// ============================================
export async function updateWidgetConfig(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    const { widgetId } = req.params;
    const { config } = req.body;

    await q(`
      UPDATE user_dashboard_layouts
      SET config = ?
      WHERE userId = ? AND widgetId = ?
    `, [JSON.stringify(config), user.id, widgetId]);

    res.json({ success: true });
  } catch (err) {
    console.error('Failed to update widget config:', err);
    serverError(res, 'Failed to update widget config');
  }
}

// ============================================
// RESET DASHBOARD TO DEFAULT
// ============================================
export async function resetDashboard(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    // Delete all user's widget layouts
    await q('DELETE FROM user_dashboard_layouts WHERE userId = ?', [user.id]);

    res.json({ success: true });
  } catch (err) {
    console.error('Failed to reset dashboard:', err);
    serverError(res, 'Failed to reset dashboard');
  }
}

// ============================================
// GET DASHBOARD DATA (all widget data in one call)
// ============================================

// Helper to safely run a query and return empty array on error
async function safeQuery<T>(query: string, params?: any[]): Promise<T[]> {
  try {
    return await q<T[]>(query, params);
  } catch (err) {
    console.warn('Dashboard query failed (table may not exist):', (err as Error).message);
    return [];
  }
}

export async function getDashboardData(req: Request, res: Response) {
  try {
    const user = getUser(req);
    if (!user) {
      return authRequired(res);
    }

    // Get user info
    const userInfo = await safeQuery<any>('SELECT displayName FROM users WHERE id = ?', [user.id]);

    // Fetch all dashboard data in parallel - using safeQuery to handle missing tables
    const [
      todaysEvents,
      upcomingEvents,
      todaysChores,
      myChores,
      shoppingItems,
      choreStats,
      choreLeaderboard,
      paidChores,
      earnings,
      familyMembers,
      announcements,
      upcomingMeals,
    ] = await Promise.all([
      // Today's events (includes multi-day events that span today)
      safeQuery<any>(`
        SELECT id, title, startAt as startTime, endAt as endTime, color, allDay
        FROM calendar_events
        WHERE DATE(startAt) <= CURDATE()
          AND (DATE(endAt) >= CURDATE() OR endAt IS NULL OR DATE(startAt) = CURDATE())
        ORDER BY startAt ASC
        LIMIT 10
      `),

      // Upcoming events (next 7 days, EXCLUDES today - starts from tomorrow)
      safeQuery<any>(`
        SELECT id, title, startAt as startTime, endAt as endTime, color, allDay
        FROM calendar_events
        WHERE DATE(startAt) > CURDATE()
          AND DATE(startAt) <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
        ORDER BY startAt ASC
        LIMIT 15
      `),

      // Today's chores (all)
      safeQuery<any>(`
        SELECT ci.id, ci.choreId, c.title, ci.status, ci.dueDate, ci.completedAt,
               u.displayName as assigneeName, u.color as assigneeColor
        FROM chore_instances ci
        JOIN chores c ON ci.choreId = c.id
        LEFT JOIN users u ON ci.assignedTo = u.id
        WHERE DATE(ci.dueDate) = CURDATE()
        ORDER BY ci.status ASC, ci.dueDate ASC
        LIMIT 10
      `),

      // My chores (next 7 days only - from today forward)
      safeQuery<any>(`
        SELECT ci.id, ci.choreId, c.title, ci.status, ci.dueDate, ci.completedAt
        FROM chore_instances ci
        JOIN chores c ON ci.choreId = c.id
        WHERE ci.assignedTo = ?
          AND ci.status IN ('pending', 'in_progress')
          AND ci.dueDate >= CURDATE()
          AND ci.dueDate <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
        ORDER BY ci.dueDate ASC
        LIMIT 10
      `, [user.id]),

      // Shopping list items
      safeQuery<any>(`
        SELECT sl.id, ci.name, sl.quantity, ci.unit,
               CASE WHEN sl.purchasedAt IS NULL THEN 0 ELSE 1 END as purchased,
               sc.name as categoryName
        FROM shopping_list sl
        JOIN catalog_items ci ON sl.catalogItemId = ci.id
        LEFT JOIN shopping_categories sc ON ci.categoryId = sc.id
        WHERE sl.active = 1 AND sl.purchasedAt IS NULL
        ORDER BY sc.sortOrder ASC, ci.name ASC
        LIMIT 15
      `),

      // Chore stats for current user
      safeQuery<any>(`
        SELECT
          COALESCE(SUM(CASE WHEN status = 'completed' THEN c.points ELSE 0 END), 0) as totalPoints,
          COUNT(CASE WHEN status = 'completed' AND DATE(completedAt) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as thisWeek
        FROM chore_instances ci
        JOIN chores c ON ci.choreId = c.id
        WHERE ci.assignedTo = ?
      `, [user.id]),

      // Leaderboard - uses totalPoints from users table (same as Chores page)
      safeQuery<any>(`
        SELECT u.id, u.displayName, u.color, u.avatarUrl, u.totalPoints as points
        FROM users u
        WHERE u.active = 1 AND u.roleId != 'kiosk'
        ORDER BY u.totalPoints DESC
        LIMIT 5
      `),

      // Available paid chores
      safeQuery<any>(`
        SELECT id, title, amount, difficulty, status
        FROM paid_chores
        WHERE status = 'available'
        ORDER BY createdAt DESC
        LIMIT 5
      `),

      // User's earnings
      safeQuery<any>(`
        SELECT COALESCE(SUM(amount), 0) as totalEarnings
        FROM paid_chore_earnings
        WHERE userId = ?
      `, [user.id]),

      // Family members
      safeQuery<any>(`
        SELECT id, displayName, nickname, color, avatarUrl, role
        FROM users
        WHERE active = 1
        ORDER BY displayName ASC
        LIMIT 10
      `),

      // Recent announcements
      safeQuery<any>(`
        SELECT m.id, m.title, m.body, m.priority, m.createdAt,
               u.displayName as fromUserName
        FROM messages m
        LEFT JOIN users u ON m.fromUserId = u.id
        WHERE m.isAnnouncement = 1
        AND (m.expiresAt IS NULL OR m.expiresAt > NOW())
        ORDER BY m.priority = 'urgent' DESC, m.priority = 'high' DESC, m.createdAt DESC
        LIMIT 5
      `),

      // Upcoming meals (next 7 days)
      safeQuery<any>(`
        SELECT mp.id, DATE_FORMAT(mp.date, '%Y-%m-%d') as date, r.name as recipeName, mp.customMealName,
               mp.isFendForYourself, mp.ffyMessage, mp.status,
               (SELECT COUNT(*) FROM meal_suggestions ms WHERE ms.mealPlanId = mp.id) as voteCount
        FROM meal_plans mp
        LEFT JOIN recipes r ON mp.recipeId = r.id
        WHERE mp.date >= CURDATE()
          AND mp.date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
        ORDER BY mp.date ASC
        LIMIT 7
      `),
    ]);

    // Ensure leaderboard points are numbers (SQL SUM can return strings)
    const leaderboardWithNumbers = choreLeaderboard.map((entry: any) => ({
      ...entry,
      points: Number(entry.points) || 0,
    }));

    res.json({
      user: userInfo[0] || { displayName: 'User' },
      todaysEvents,
      upcomingEvents,
      todaysChores,
      myChores,
      shoppingItems,
      choreStats: choreStats[0] || { totalPoints: 0, thisWeek: 0 },
      choreLeaderboard: leaderboardWithNumbers,
      paidChores,
      earnings: Number(earnings[0]?.totalEarnings) || 0,
      familyMembers,
      announcements,
      upcomingMeals,
    });
  } catch (err) {
    console.error('Failed to get dashboard data:', err);
    serverError(res, 'Failed to get dashboard data');
  }
}
