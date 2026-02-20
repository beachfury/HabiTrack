# HabiTrack Widget Standard

Version 1.0 | February 2026

This document defines the contract for building widgets for the HabiTrack dashboard. All built-in widgets follow this standard, and community-submitted widgets must comply with it to be accepted into the Store.

---

## Overview

A widget is a self-contained UI component that renders inside the dashboard grid on the Home page. Widgets receive data from the centralized `DashboardData` endpoint and display it in a focused, configurable card.

Each widget consists of:
- A **manifest** describing what it is and what data it needs
- A **React component** that renders the UI
- A **props adapter** that maps from dashboard data to widget-specific props

Widgets are wrapped in an error boundary (`WidgetSandbox`) so a crash in one widget never breaks the entire dashboard.

---

## Directory Structure

Each community widget lives in its own folder under `widgets/`:

```
widgets/
  my-custom-widget/
    manifest.json       <- REQUIRED: widget metadata
    MyCustomWidget.tsx   <- REQUIRED: React component (default or named export)
    adapter.ts           <- REQUIRED: props adapter function
    index.ts             <- REQUIRED: barrel export
    useMyData.ts         <- optional: custom hooks
    helpers.ts           <- optional: utility functions
```

Built-in widgets live in `widgets/_built-in/` and follow the same pattern, but their manifests and adapters are consolidated in `widgets/_registry/`.

---

## manifest.json

Every widget must declare a `manifest.json` file that conforms to the `WidgetManifest` type:

```json
{
  "id": "my-custom-widget",
  "version": "1.0.0",
  "name": "My Custom Widget",
  "description": "A brief description of what this widget shows",
  "author": "Your Name",
  "category": "general",
  "icon": "sparkles",
  "size": {
    "defaultW": 2,
    "defaultH": 2,
    "minW": 1,
    "minH": 1,
    "maxW": 4,
    "maxH": 4
  },
  "dataSources": ["todaysChores"],
  "roles": null,
  "configSchema": null,
  "builtIn": false,
  "tags": ["custom", "demo"]
}
```

### Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier, kebab-case (e.g. `my-widget`) |
| `version` | string | Yes | Semver format (e.g. `1.0.0`) |
| `name` | string | Yes | Display name shown in Store and widget picker |
| `description` | string | Yes | Short description of the widget's purpose |
| `author` | string | Yes | Your name or organization |
| `category` | string | Yes | One of: `general`, `calendar`, `chores`, `shopping`, `meals`, `messages`, `family`, `finance`, `custom` |
| `icon` | string | Yes | Lucide icon name (e.g. `calendar`, `check-square`) |
| `size` | object | Yes | Grid layout constraints (see below) |
| `dataSources` | string[] | Yes | Keys from DashboardData this widget needs, or `[]` for self-managed |
| `roles` | string[] \| null | Yes | Role restrictions (`null` = all roles, `["admin"]` = admin only) |
| `configSchema` | object \| null | Yes | JSON Schema for user-configurable settings, or `null` |
| `builtIn` | boolean | Yes | Must be `false` for community widgets |
| `tags` | string[] | Yes | Searchable tags for the Store |
| `themedClass` | string | No | CSS class for the widget container (optional, falls back to `themed-card`) |

### Size Constraints

The dashboard uses a 4-column grid. Size values are in grid units:

| Property | Description |
|----------|-------------|
| `defaultW` | Default width (1-4 columns) |
| `defaultH` | Default height (1-4 rows) |
| `minW` | Minimum width the user can resize to |
| `minH` | Minimum height the user can resize to |
| `maxW` | Maximum width (`null` = no limit) |
| `maxH` | Maximum height (`null` = no limit) |

---

## Available Data Sources

Widgets declare which data they need via the `dataSources` array. These keys map to fields returned by `GET /api/dashboard/data`:

| Key | Data Type | Description |
|-----|-----------|-------------|
| `user` | `{ id, displayName, role }` | Current user info |
| `todaysEvents` | `Event[]` | Calendar events for today |
| `upcomingEvents` | `Event[]` | Events in the next 7 days |
| `todaysChores` | `ChoreAssignment[]` | Chores assigned today (all family) |
| `myChores` | `Chore[]` | Current user's personal chore list |
| `choreLeaderboard` | `LeaderboardEntry[]` | Family rankings by points |
| `shoppingItems` | `ShoppingItem[]` | Items on the shopping list |
| `availablePaidChores` | `PaidChore[]` | Unclaimed paid chores |
| `myEarnings` | `{ total, pending, thisWeek }` | Current user's earnings |
| `familyMembers` | `FamilyMember[]` | Active household members |
| `announcements` | `Announcement[]` | Family announcements |
| `upcomingMeals` | `MealPlan[]` | Upcoming meal plans |
| `quickStats` | `{ events, chores, shopping }` | Aggregated counts |

If your widget manages its own data (like the Weather widget), set `dataSources: []`.

---

## Props Adapter

The adapter is a pure function that extracts widget-specific props from the centralized dashboard data:

```typescript
// adapter.ts
import type { WidgetPropsAdapter } from '../../../../types/widget';

export const adapter: WidgetPropsAdapter = (data, currentUserId) => ({
  chores: data.todaysChores || [],
  currentUserId,
});
```

The adapter receives:
1. `data` - The full `DashboardData` object with all data sources
2. `currentUserId` - The logged-in user's ID (optional, for personalization)

It must return a plain object matching your component's props interface.

The adapter also receives an optional third argument `config` containing the user's saved configuration for this widget (see Widget Configuration below):

```typescript
export const adapter: WidgetPropsAdapter = (data, currentUserId, config) => ({
  events: data.upcomingEvents || [],
  daysAhead: (config?.daysAhead as number) || 7,
  showAllDay: config?.showAllDay !== false,
});
```

---

## Widget Configuration (configSchema)

Widgets can expose user-configurable settings through the `configSchema` field in their manifest. When a widget has a non-null `configSchema`, a gear icon appears in the dashboard customize mode, opening an auto-generated settings form.

### How Config Flows

1. Widget declares `configSchema` in `manifest.json`
2. User enters customize mode on the Home page
3. Gear icon appears on configurable widgets
4. User clicks gear → settings modal auto-generated from schema
5. User saves → config stored per-user in the database
6. Config passed to adapter as the 3rd argument
7. Adapter extracts config values and passes to widget component

### ConfigSchema Format

The `configSchema` follows a simplified JSON Schema subset:

```json
{
  "configSchema": {
    "properties": {
      "fieldName": {
        "type": "string | number | boolean",
        "title": "Display Label",
        "description": "Help text shown below the label",
        "default": "default value",
        "enum": ["option1", "option2"],
        "enumLabels": ["Option One", "Option Two"],
        "format": "date | color",
        "minimum": 1,
        "maximum": 100
      }
    }
  }
}
```

### Supported Field Types

| Type | Schema | Renders As |
|------|--------|------------|
| Text input | `{ "type": "string" }` | `<input type="text">` |
| Number input | `{ "type": "number", "minimum": 1, "maximum": 30 }` | `<input type="number">` |
| Toggle | `{ "type": "boolean" }` | Toggle switch |
| Dropdown | `{ "type": "string", "enum": [...] }` | `<select>` |
| Date picker | `{ "type": "string", "format": "date" }` | `<input type="date">` |
| Color picker | `{ "type": "string", "format": "color" }` | Color input |

### Field Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | string | Yes | `"string"`, `"number"`, or `"boolean"` |
| `title` | string | Yes | Label displayed to the user |
| `description` | string | No | Help text shown below the label |
| `default` | any | Recommended | Default value when no config is saved |
| `enum` | string[] | No | For dropdowns — list of valid values |
| `enumLabels` | string[] | No | Human-readable labels for enum values |
| `format` | string | No | `"date"` or `"color"` for string fields |
| `minimum` | number | No | Minimum value for number fields |
| `maximum` | number | No | Maximum value for number fields |

### Complete Example

The built-in Upcoming Events widget uses configSchema:

**manifest.json** (excerpt):
```json
{
  "configSchema": {
    "properties": {
      "daysAhead": {
        "type": "number",
        "title": "Days Ahead",
        "description": "How many days ahead to show events",
        "default": 7,
        "minimum": 1,
        "maximum": 30
      },
      "showAllDay": {
        "type": "boolean",
        "title": "Show All-Day Events",
        "description": "Include all-day events in the list",
        "default": true
      }
    }
  }
}
```

**adapter.ts**:
```typescript
export const adapter: WidgetPropsAdapter = (data, _userId, config) => ({
  events: data.upcomingEvents || [],
  daysAhead: (config?.daysAhead as number) || 7,
  showAllDay: config?.showAllDay !== false,
});
```

### No Configuration

If your widget has no configurable settings, set `configSchema: null` in the manifest. No gear icon will appear.

---

## Component

Your widget component receives the props returned by the adapter:

```tsx
// MyCustomWidget.tsx
import { CheckSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MyCustomWidgetProps {
  chores: Array<{ id: number; title: string; status: string }>;
  currentUserId?: number;
}

export function MyCustomWidget({ chores = [] }: MyCustomWidgetProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-[var(--color-foreground)] flex items-center gap-2">
          <CheckSquare size={18} className="text-[var(--color-primary)]" />
          My Custom Widget
        </h3>
        <Link to="/chores" className="text-sm text-[var(--color-primary)] hover:opacity-80">
          View All
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2">
        {chores.map((chore) => (
          <div key={chore.id} className="themed-widget flex items-center gap-3">
            <p className="text-sm text-[var(--color-foreground)]">{chore.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Barrel Export

Your `index.ts` must export both the component and the adapter:

```typescript
// index.ts
export { MyCustomWidget as Component } from './MyCustomWidget';
export { adapter } from './adapter';
```

---

## Allowed APIs

Widgets may use:

- **React** - hooks (`useState`, `useEffect`, `useCallback`, `useMemo`, `useRef`, `useMemo`)
- **lucide-react** - icons (any icon from the library)
- **react-router-dom** - `Link` component and `useNavigate` hook
- **date-fns** - date formatting utilities
- **CSS variables** - all `var(--color-*)` theme variables
- **CSS classes** - `themed-widget` for sub-items, `themed-card` for card-like elements

---

## Forbidden APIs

The following are **not allowed** in widget code and will be flagged by the security scanner:

| API | Reason |
|-----|--------|
| `fetch()` | Network requests |
| `XMLHttpRequest` | Network requests |
| `WebSocket` | Network connections |
| `navigator.sendBeacon()` | Network requests |
| Dynamic `import()` | Code loading |
| `require()` | Module loading |
| `new Worker()` / `new SharedWorker()` | Background execution |
| `eval()` | Arbitrary code execution |
| `new Function()` | Code execution |
| `window.open()` | Opens new windows |
| `document.cookie` | Cookie access |
| `localStorage` / `sessionStorage` | Storage access |
| `indexedDB` | Database access |
| Hardcoded URLs (`http://`, `https://`) | External references |

### Self-Managed Data Exception

Widgets with `dataSources: []` that need to fetch their own data (like the built-in Weather widget) may request an exemption for `fetch()` during admin review. This is granted on a case-by-case basis and requires clear justification of what URL is being fetched and why.

---

## Theming Integration

### Container Styling
The widget's outer container automatically receives the CSS class specified in `manifest.themedClass`. If not set, it falls back to `themed-card`. Theme designers can customize these classes through the theme editor.

### Internal Elements
Use the `themed-widget` class on internal list items and sub-cards:

```tsx
<div className="themed-widget flex items-center gap-3">
  {/* item content */}
</div>
```

### Colors
All colors must use CSS custom properties, never hardcoded values:

```tsx
// Good
<p className="text-[var(--color-foreground)]">Hello</p>
<div style={{ color: 'var(--color-primary)' }}>Accent</div>

// Bad - never do this
<p style={{ color: '#333333' }}>Hello</p>
<div className="text-blue-500">Accent</div>
```

### Available CSS Variables

| Variable | Purpose |
|----------|---------|
| `--color-primary` | Primary accent color |
| `--color-foreground` | Main text color |
| `--color-background` | Page background |
| `--color-muted-foreground` | Secondary/muted text |
| `--color-border` | Border color |
| `--color-success` | Success/positive color |
| `--color-warning` | Warning color |
| `--color-destructive` | Error/danger color |
| `--widget-bg` | Widget background |
| `--widget-border` | Widget border color |
| `--widget-radius` | Widget border radius |
| `--widget-padding` | Widget padding |

---

## Size Guidelines

- **Component file**: Max 300 lines (widgets should be focused)
- **Total widget folder**: Max 5 files
- **No external dependencies** beyond the allowed list above
- **No cross-widget imports** - each widget must be fully self-contained

---

## Error Handling

All widgets are automatically wrapped in `WidgetSandbox`, a React error boundary. If your widget throws an error:

1. The error is caught and logged
2. The widget shows a friendly error message with a retry button
3. Other widgets on the dashboard continue working normally

You do not need to implement your own error boundary. However, you should:
- Handle empty/missing data gracefully (show "No data" states)
- Default all array props to `[]`
- Default all optional props to sensible fallbacks

---

## Validation

Widget manifests are validated at registration time using `validateManifest()`. The validator checks:

- `id` is kebab-case
- `version` is valid semver
- All required fields are present and correctly typed
- `category` is a valid category enum value
- `size` constraints are positive numbers
- `builtIn` is `false` for community widgets

Widget source code is optionally scanned by `scanWidgetCode()` for forbidden patterns (see Forbidden APIs above).

---

## Example: Complete Widget

### `manifest.json`
```json
{
  "id": "daily-quote",
  "version": "1.0.0",
  "name": "Daily Quote",
  "description": "Shows an inspiring quote that changes daily",
  "author": "Jane Developer",
  "category": "general",
  "icon": "quote",
  "size": { "defaultW": 2, "defaultH": 1, "minW": 2, "minH": 1, "maxW": 4, "maxH": 2 },
  "dataSources": [],
  "roles": null,
  "configSchema": null,
  "builtIn": false,
  "tags": ["quote", "motivation", "daily"]
}
```

### `DailyQuoteWidget.tsx`
```tsx
import { Quote } from 'lucide-react';

const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Well done is better than well said.", author: "Benjamin Franklin" },
];

export function DailyQuoteWidget() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  const quote = QUOTES[dayOfYear % QUOTES.length];

  return (
    <div className="h-full flex flex-col justify-center items-center text-center p-2">
      <Quote size={20} className="text-[var(--color-primary)] mb-2" />
      <p className="text-sm italic text-[var(--color-foreground)]">"{quote.text}"</p>
      <p className="text-xs text-[var(--color-muted-foreground)] mt-1">- {quote.author}</p>
    </div>
  );
}
```

### `adapter.ts`
```typescript
import type { WidgetPropsAdapter } from '../../../../types/widget';

export const adapter: WidgetPropsAdapter = () => ({});
```

### `index.ts`
```typescript
export { DailyQuoteWidget as Component } from './DailyQuoteWidget';
export { adapter } from './adapter';
```
