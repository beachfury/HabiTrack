# HabiTrack

<p align="center">
  <img src="apps/web/public/logo.svg" alt="HabiTrack Logo" width="120" height="120">
</p>

<p align="center">
  <strong>A self-hosted family household management app</strong><br>
  Chores, shopping, calendar, budgets, meals, messaging, and more — built for a single household running on your own server.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#screenshots">Screenshots</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#documentation">Documentation</a>
</p>

---

## Features

### 📊 Dashboard
- Customizable drag-and-drop widget grid
- Quick stats (events, chores, shopping counts)
- Weather widget with location-based forecasts
- Today's events and chores at a glance
- Family leaderboard
- Upcoming meals preview

### ✅ Chores Management
- Create chore templates with custom icons and colors
- Recurring schedules (daily, weekly, monthly, custom)
- Per-member assignments with rotation support
- Completion tracking with points and streaks
- Family leaderboard with gamification
- Stats dashboard (completion rate, streaks, weekly progress)

### 💰 Paid Chores
- Extra tasks kids can claim for money
- Admin approval workflow
- Configurable payout amounts
- Track earnings per family member

### 🛒 Shopping
- Shared shopping lists with categories
- Multi-store support with store-specific lists
- Price tracking and history
- Product catalog with favorites
- Member request system with admin approval
- Smart predictions based on purchase history
- Inline item editing (tap to edit name, quantity, notes)
- Barcode scanning support (planned)

### 📅 Calendar
- Family calendar with color-coded events
- Multi-day event support
- Per-member event filtering
- Day detail view with all activities
- Integration with chores and meals

### 🍽️ Meals & Recipes
- Weekly meal planning
- Recipe management with ingredients
- Automatic shopping list generation from meal plans
- Recipe categories and favorites
- Cooking instructions with step-by-step view

### 💵 Budgets
- Admin-only budget tracking
- Multiple budget types: monthly, yearly, one-time
- Categories for bills, utilities, groceries, etc.
- Monthly spending overview with analytics
- Budget vs. actual comparison charts
- Expense history and trends
- Entry management with filters and search

### 💬 Messaging
- System notifications for chore completions, events, etc.
- Admin announcements to the whole family
- Direct messages between family members
- Read/unread tracking
- Notification badges

### 👨‍👩‍👧‍👦 Family Management
- Add and manage family members
- Role-based permissions (Admin, Member, Kid, Kiosk)
- Custom avatars with image upload or color selection
- Password and PIN management
- Activity tracking

### 🎨 Advanced Theming System
HabiTrack features a powerful theming system that allows deep customization:

- **Light/Dark/System modes** with per-user preference
- **Mode-aware colors** — separate color palettes for light and dark modes
- **Global color palette** customization (primary, accent, background, card, muted, border, destructive, success, warning)
- **Per-element styling** — customize cards, widgets, buttons, inputs, modals individually
- **Per-page backgrounds** — different backgrounds for each section of the app (14 pages supported)
- **Page-specific element overrides** — style the calendar grid differently than the chores card
- **Background images** with opacity control and media library
- **Animated CSS effects** — Matrix rain, snowfall, sparkle, bubbles, embers (combinable!)
- **Typography control** — custom fonts, sizes, line heights
- **Border radius and shadow** presets
- **Live preview** in the theme editor with 14 page previews
- **"Apply to All"** — quickly copy background settings across multiple pages
- **Theme library** — save, duplicate, and share themes
- **Kid-safe themes** — admins can approve themes for kids to use
- **Two default themes**: HabiTrack Classic (uneditable) and Household Brand (customizable)

### ⚙️ Settings
- **Profile**: Nickname, email, avatar, profile color
- **Themes**: Full theme editor with live preview
- **Notifications**: Configure notification preferences
- **Security**: Password management
- **Household** (Admin): Household name, timezone settings
- **Email** (Admin): SMTP configuration for notifications
- **Debug** (Admin): System diagnostics and logging
- **About**: Version info and system requirements

### 🔍 Debug & Diagnostics (Admin)
- Toggle debug mode on/off
- Configure log levels (Error, Warning, Info, Debug)
- View recent system logs with filtering
- Monitor frontend JavaScript errors
- System information display (Node version, memory, uptime)
- Log retention settings (1-30 days)

### 🖥️ Kiosk Mode
- PIN-based quick login for shared household screens
- Simplified display-focused interface
- Perfect for wall-mounted tablets or kitchen displays

### 📱 Mobile Responsive
- Fully usable on phones, tablets, and desktops
- Responsive sidebar that collapses to hamburger menu on mobile
- Touch-friendly controls and tap targets
- Responsive grids that adapt to screen size
- Horizontally scrollable calendar and month views on small screens
- All modals properly sized for mobile viewports

### 🔄 Version Management & Backups
- Browse all GitHub releases and upgrade or rollback to any version
- One-click database backups with download and restore
- Pre-update backup reminders to protect your data
- Admin-only access with type-to-confirm safety for destructive operations

### 🔒 Security
- Argon2id password hashing
- HTTP-only session cookies
- CSRF protection
- Role-based access control
- Self-hosted — your data stays on your network

---

## Screenshots

*Coming soon*

---

## Tech Stack

| Layer     | Technology                                                        |
| --------- | ----------------------------------------------------------------- |
| Frontend  | React 19, TypeScript, Vite, Tailwind CSS v4                       |
| Backend   | Node.js, Express, TypeScript                                      |
| Database  | MariaDB 11 (MySQL-compatible)                                     |
| Auth      | Argon2id password hashing, HTTP-only session cookies, CSRF tokens |
| Container | Docker + Docker Compose                                           |
| Monorepo  | pnpm workspaces                                                   |

---

## Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/beachfury/HabiTrack.git
cd HabiTrack

# Copy and configure environment
cp .env.example .env
# Edit .env with your settings (see Configuration section)

# Start all services
docker compose up -d

# Open http://localhost:3000 in your browser
```

### Local Development

```bash
# Prerequisites: Node.js 22+, pnpm 10+, Docker

# Install dependencies
pnpm install

# Start database only
docker compose up -d db

# Start API (terminal 1)
pnpm -F api dev

# Start frontend (terminal 2)
pnpm -F web dev
```

| Service  | Default URL           |
| -------- | --------------------- |
| Frontend | http://localhost:5173 |
| API      | http://localhost:3001 |

---

## Documentation

### Server Deployment Guide

#### Prerequisites

- A Linux server (Ubuntu 20.04+, Debian 11+, or similar)
- [Docker](https://docs.docker.com/engine/install/) and [Docker Compose](https://docs.docker.com/compose/install/)
- A domain name (optional, but recommended for HTTPS)
- At least 1GB RAM and 10GB disk space

#### Step 1: Install Docker (if not installed)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (logout/login required)
sudo usermod -aG docker $USER

# Install Docker Compose plugin
sudo apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

#### Step 2: Clone the Repository

```bash
cd /opt
sudo git clone https://github.com/beachfury/HabiTrack.git habitrack
sudo chown -R $USER:$USER habitrack
cd habitrack
```

#### Step 3: Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit the configuration
nano .env
```

**Important settings to change in `.env`:**

```env
# Database - CHANGE THESE PASSWORDS!
DB_PASSWORD=your-secure-database-password
DB_ROOT_PASSWORD=your-secure-root-password

# API Security - CHANGE THESE!
API_SECRET=generate-a-long-random-string-here
SESSION_SECRET=generate-another-long-random-string

# Your server's URL (use your domain or IP)
CORS_ORIGIN=http://your-server-ip:3000
VITE_API_URL=http://your-server-ip:3001/api
VITE_API_BASE_URL=http://your-server-ip:3001
```

**Generate secure random strings:**

```bash
openssl rand -hex 32  # Run twice for API_SECRET and SESSION_SECRET
```

#### Step 4: Start the Application

```bash
# Build and start all containers
docker compose up -d

# Check if containers are running
docker compose ps

# View logs
docker compose logs -f
```

#### Step 5: Initial Setup

1. Open your browser and go to `http://your-server-ip:3000`
2. Complete the bootstrap wizard to create your admin account
3. Start adding family members!

---

### Production Deployment (with HTTPS)

For production use with a domain name and SSL certificate:

#### Using Nginx as Reverse Proxy

1. **Install Nginx and Certbot:**

```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

2. **Create Nginx configuration:**

```bash
sudo nano /etc/nginx/sites-available/habitrack
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. **Enable the site and get SSL certificate:**

```bash
sudo ln -s /etc/nginx/sites-available/habitrack /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

4. **Update your `.env` file:**

```env
CORS_ORIGIN=https://your-domain.com
VITE_API_URL=https://your-domain.com/api
VITE_API_BASE_URL=https://your-domain.com
```

5. **Rebuild and restart:**

```bash
docker compose down
docker compose up -d --build
```

---

### Managing the Application

#### Common Commands

```bash
# Start the application
docker compose up -d

# Stop the application
docker compose down

# View logs
docker compose logs -f

# View logs for specific service
docker compose logs -f api
docker compose logs -f web
docker compose logs -f db

# Restart a specific service
docker compose restart api

# Rebuild after code changes
docker compose up -d --build

# Check container status
docker compose ps
```

#### Updating HabiTrack

```bash
cd /opt/habitrack

# Pull latest changes
git pull

# Rebuild and restart
docker compose down
docker compose up -d --build
```

#### Database Backup

```bash
# Backup
docker compose exec db mysqldump -u root -p habitrackdb > backup_$(date +%Y%m%d).sql

# Restore
docker compose exec -T db mysql -u root -p habitrackdb < backup_file.sql
```

#### Running Migrations

Migrations run automatically on API startup, but you can also run them manually:

```bash
cd apps/api
npm run db:migrate
```

#### Troubleshooting

**Container won't start:**

```bash
docker compose logs api  # Check for errors
docker compose down
docker compose up -d
```

**Database connection issues:**

```bash
# Check if database is ready
docker compose exec db mysql -u habitrack -p -e "SELECT 1"
```

**Reset everything (WARNING: destroys all data):**

```bash
docker compose down -v  # Removes volumes too
docker compose up -d
```

---

### Unraid Installation

#### Option 1: Using Docker Compose (Recommended)

1. **Install the Compose Manager plugin** from Community Applications (CA)

2. **Create the stack directory:**
   - Open Unraid terminal or SSH

   ```bash
   mkdir -p /mnt/user/appdata/habitrack
   cd /mnt/user/appdata/habitrack
   ```

3. **Download the docker-compose file:**

   ```bash
   wget https://raw.githubusercontent.com/beachfury/HabiTrack/main/docker-compose.yml
   wget https://raw.githubusercontent.com/beachfury/HabiTrack/main/.env.example -O .env
   ```

4. **Edit the environment file:**

   ```bash
   nano .env
   ```

   Change these values:

   ```env
   DB_PASSWORD=your-secure-password
   DB_ROOT_PASSWORD=your-secure-root-password
   API_SECRET=generate-a-long-random-string
   SESSION_SECRET=generate-another-random-string
   CORS_ORIGIN=http://YOUR-UNRAID-IP:3000
   VITE_API_URL=http://YOUR-UNRAID-IP:3001/api
   VITE_API_BASE_URL=http://YOUR-UNRAID-IP:3001
   ```

5. **Start the stack** in Compose Manager or run:

   ```bash
   docker-compose up -d
   ```

6. **Access HabiTrack** at `http://YOUR-UNRAID-IP:3000`

#### Option 2: Manual Docker Containers

If you prefer to set up containers manually through the Unraid Docker UI:

##### Container 1: MariaDB Database

| Setting      | Value        |
| ------------ | ------------ |
| Name         | habitrack-db |
| Repository   | mariadb:11   |
| Network Type | Bridge       |
| Port         | 3306 → 3306  |

**Environment Variables:**
| Variable | Value |
|----------|-------|
| MYSQL_ROOT_PASSWORD | your-secure-root-password |
| MYSQL_DATABASE | habitrackdb |
| MYSQL_USER | habitrack |
| MYSQL_PASSWORD | your-secure-password |

**Paths:**
| Container Path | Host Path |
|----------------|-----------|
| /var/lib/mysql | /mnt/user/appdata/habitrack/db |

##### Container 2: HabiTrack API

| Setting      | Value                                  |
| ------------ | -------------------------------------- |
| Name         | habitrack-api                          |
| Repository   | ghcr.io/beachfury/habitrack-api:latest |
| Network Type | Bridge                                 |
| Port         | 3001 → 3001                            |

**Environment Variables:**
| Variable | Value |
|----------|-------|
| DB_HOST | YOUR-UNRAID-IP |
| DB_PORT | 3306 |
| DB_NAME | habitrackdb |
| DB_USER | habitrack |
| DB_PASSWORD | your-secure-password |
| API_SECRET | your-long-random-string |
| SESSION_SECRET | another-random-string |
| CORS_ORIGIN | http://YOUR-UNRAID-IP:3000 |

##### Container 3: HabiTrack Web

| Setting      | Value                                  |
| ------------ | -------------------------------------- |
| Name         | habitrack-web                          |
| Repository   | ghcr.io/beachfury/habitrack-web:latest |
| Network Type | Bridge                                 |
| Port         | 3000 → 80                              |

**Environment Variables:**
| Variable | Value |
|----------|-------|
| VITE_API_URL | http://YOUR-UNRAID-IP:3001/api |
| VITE_API_BASE_URL | http://YOUR-UNRAID-IP:3001 |

#### Data Persistence on Unraid

Store your data in `/mnt/user/appdata/habitrack/`:

```
/mnt/user/appdata/habitrack/
├── db/          # MariaDB data
├── uploads/     # User uploads (avatars, logos, theme assets)
└── .env         # Environment configuration
```

#### Using with Nginx Proxy Manager (NPM)

If you use Nginx Proxy Manager (common on Unraid):

**1. Create Proxy Host in NPM:**
   - Domain: `habitrack.yourdomain.com`
   - Scheme: `http`
   - Forward Hostname/IP: Your server's IP (e.g., `192.168.1.100`)
   - Forward Port: `8080`
   - Enable "Websockets Support" ✓
   - Enable SSL with "Force SSL" ✓

**2. Configure HabiTrack for HTTPS:**

```env
# In your .env file:
HABITRACK_ENV=production
HABITRACK_BASE_URL=https://habitrack.yourdomain.com
HABITRACK_ALLOWED_ORIGINS=https://habitrack.yourdomain.com
HABITRACK_TRUSTED_PROXIES=10.0.0.0/8,172.16.0.0/12,192.168.0.0/16
```

**3. Restart containers:**

```bash
docker compose down && docker compose up -d
```

> **Important:** Setting `HABITRACK_ENV=production` enables secure cookies required for HTTPS. Without this, authentication will fail when accessing via your domain.

See [DOCKER-README.md](DOCKER-README.md) for detailed Nginx Proxy Manager setup instructions.

#### Using with SWAG

If you use SWAG:

1. Point your domain to your Unraid IP
2. Create a proxy host for HabiTrack
3. Forward to `http://YOUR-UNRAID-IP:8080`
4. Enable SSL

---

## Store / Marketplace

The Store page (`/store`) lets users browse all available widgets and themes in one place.

### How it Works

- **Widgets** are currently all built-in. The catalog shows the 14 shipped widgets with their metadata (name, description, category, tags).
- **Themes** include both built-in system themes and any user-created public themes from the database.
- **Admins** can import `.habi-theme` files and export existing themes directly from the store.
- **Members & Kids** can browse the catalog and submit install requests. Admins review and approve/dismiss these from the Pending Requests section.

### Permission Model

| Role | Browse | Import/Export | Install | Request |
|------|--------|---------------|---------|---------|
| Admin | Yes | Yes | Yes | N/A |
| Member | Yes | No | No | Yes |
| Kid | Yes (filtered) | No | No | Yes |

---

## Creating a Custom Widget

Widgets are React components registered in a central manifest system. Every widget lives in `apps/web/src/components/dashboard/widgets/`.

### Step 1: Create the Component

Create a new file:

```
apps/web/src/components/dashboard/widgets/MyCustomWidget.tsx
```

```tsx
interface MyCustomWidgetProps {
  userName?: string;
  // Add whatever props your widget needs
}

export function MyCustomWidget({ userName = 'User' }: MyCustomWidgetProps) {
  return (
    <div className="h-full flex flex-col p-1">
      <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-2">
        My Widget
      </h3>
      <p className="text-[var(--color-muted-foreground)]">
        Hello, {userName}!
      </p>
    </div>
  );
}
```

**Rules for widget components:**

- Use `h-full` so the widget fills its grid cell
- Use CSS variables for **all** colors (`var(--color-foreground)`, `var(--color-primary)`, etc.) — never hardcode colors
- Keep it self-contained; don't rely on external state beyond what's passed as props
- If your widget fetches its own data (like the Weather widget), do it internally with `useEffect`

### Step 2: Register in the Widget Registry

Open `apps/web/src/components/dashboard/widgets/index.ts` and add three things:

**a) Import your component:**

```ts
import { MyCustomWidget } from './MyCustomWidget';
```

**b) Define the manifest:**

```ts
const myCustomManifest: WidgetManifest = {
  id: 'my-custom',                    // kebab-case, unique
  version: '1.0.0',                   // semver
  name: 'My Custom Widget',           // display name
  description: 'A short description', // shown in store catalog
  author: 'Your Name',
  category: 'custom',                 // general|calendar|chores|shopping|meals|messages|family|finance|custom
  icon: 'sparkles',                   // any Lucide icon name
  size: {
    defaultW: 2, defaultH: 2,         // default grid size (grid is 4 columns wide)
    minW: 1, minH: 1,                 // minimum resize
    maxW: 4, maxH: 4,                 // maximum resize (null = unlimited)
  },
  dataSources: ['user'],              // keys from DashboardData this widget needs
  roles: null,                        // null = visible to all roles, or ['admin', 'member']
  configSchema: null,                 // reserved for future widget settings UI
  builtIn: false,
  tags: ['custom', 'example'],
  themedClass: 'themed-my-custom',    // CSS class the theme system can target
};
```

**c) Define the props adapter:**

The adapter maps the centralized `DashboardData` object (fetched once by the dashboard) to your widget's props:

```ts
const myCustomAdapter: WidgetPropsAdapter = (data) => ({
  userName: (data.user as any)?.displayName || 'User',
});
```

**d) Add to the registry Map:**

```ts
widgetRegistry.set('my-custom', {
  manifest: myCustomManifest,
  component: MyCustomWidget,
  getProps: myCustomAdapter,
});
```

### Step 3: Add to the Database

Create or update a migration in `providers/storage-mariadb/migrations/`:

```sql
INSERT INTO `dashboard_widgets`
  (`id`, `name`, `description`, `icon`, `category`, `defaultW`, `defaultH`,
   `minW`, `minH`, `maxW`, `maxH`, `sortOrder`, `version`, `author`,
   `dataSources`, `builtIn`, `source`)
VALUES
  ('my-custom', 'My Custom Widget', 'A short description', 'sparkles', 'custom',
   2, 2, 1, 1, 4, 4, 99, '1.0.0', 'Your Name',
   '["user"]', 0, 'custom');
```

### Step 4: Rebuild

```bash
docker compose --profile web down && docker compose --profile web up -d --build
```

### Available Data Sources

When the adapter receives `DashboardData`, these keys are available:

| Key | Type | Contents |
|-----|------|----------|
| `user` | object | `{ id, displayName, role }` |
| `quickStats` | object | `{ eventsToday, choresToday, shoppingItems }` |
| `todaysEvents` | array | Calendar events for today |
| `upcomingEvents` | array | Events for next 7 days |
| `todaysChores` | array | Chores due today |
| `myChores` | array | User's assigned chores |
| `choreLeaderboard` | array | Rankings by points |
| `shoppingItems` | array | Active shopping list |
| `availablePaidChores` | array | Claimable paid chores |
| `myEarnings` | object | `{ total, thisWeek, thisMonth }` |
| `familyMembers` | array | Household members |
| `announcements` | array | Recent announcements |
| `upcomingMeals` | array | Meal plans with voting |

### Widget File Structure Summary

```
apps/web/src/components/dashboard/widgets/
├── index.ts                  # Central registry — manifests, adapters, Map
├── WelcomeWidget.tsx         # Simple stateless widget (receives props)
├── WeatherWidget.tsx         # Self-managed data widget (fetches own API)
├── QuickStatsWidget.tsx
├── TodaysEventsWidget.tsx
├── UpcomingEventsWidget.tsx
├── TodaysChoresWidget.tsx
├── MyChoresWidget.tsx
├── ChoreLeaderboardWidget.tsx
├── ShoppingListWidget.tsx
├── PaidChoresWidget.tsx
├── EarningsWidget.tsx
├── FamilyMembersWidget.tsx
├── AnnouncementsWidget.tsx
├── UpcomingMealsWidget.tsx
└── MyCustomWidget.tsx        # <-- Your new widget
```

---

## Creating a Custom Theme

Themes control the entire look of HabiTrack. There are **no separate CSS files** — the entire theme system works through JSON that gets converted to CSS custom properties at runtime.

### How Themes Work (the Pipeline)

Understanding the pipeline is key to creating themes:

```
.habi-theme JSON (or database record)
    ↓
buildCssVariables()        ← converts JSON → flat CSS variable map
    ↓
applyCssVariables()        ← sets each on document.documentElement.style
    ↓
Components read via        ← var(--color-primary), var(--card-bg), etc.
```

**Every component** in HabiTrack references CSS variables, never hardcoded colors. When you change a theme, `buildCssVariables()` regenerates the variable map and `applyCssVariables()` swaps them all at once — instant theme switch, no page reload.

### Theme File Structure

The code that powers this lives in:

```
apps/web/src/
├── context/
│   ├── ThemeContext.tsx              # Theme state management, loads/applies themes
│   └── css/                         # CSS variable generation pipeline
│       ├── index.ts                 # buildCssVariables() + applyCssVariables()
│       ├── colorVariables.ts        # ThemeColors → --color-* variables
│       ├── elementVariables.ts      # ElementStyle → --{element}-* variables
│       ├── specialModes.ts          # Login page, kiosk, LCARS variable generators
│       ├── animationClasses.ts      # Matrix rain, snowfall, sparkle effects
│       └── utils.ts                 # resolveImageUrl, opacity helpers
├── types/
│   ├── theme.ts                     # Barrel export
│   ├── theme-core.ts                # Theme, ThemeColors, ThemeLayout, etc.
│   └── theme-extended.ts            # ElementStyle, ThemeableElement (40+ types)
├── components/themes/
│   ├── ThemeEditorAdvanced.tsx       # Main theme editor UI
│   ├── ElementStyleEditor.tsx        # Per-element style editor
│   ├── LoginPageEditor.tsx           # Login page theme editor
│   ├── editors/                      # 17 sub-editor tabs
│   │   ├── BackgroundTab.tsx
│   │   ├── TextTab.tsx
│   │   ├── BorderTab.tsx
│   │   ├── EffectsTab.tsx
│   │   └── ...
│   └── hooks/
│       └── useThemeHistory.ts        # Undo/redo for theme editing
└── utils/
    └── themeValidation.ts            # .habi-theme file validation
```

On the API side:

```
apps/api/src/
├── routes/themes/
│   ├── index.ts                     # Theme CRUD endpoints
│   └── importExport.ts              # GET /themes/:id/export, POST /themes/import
└── utils/
    └── themeSanitization.ts          # CSS sanitization for imported themes
```

### CSS Variable Reference

When a theme is active, these CSS variables are set on `:root`:

**Core colors** (from `colorsLight` or `colorsDark` based on mode):

| Variable | Source Field | Example |
|----------|-------------|---------|
| `--color-primary` | `primary` | `#3cb371` |
| `--color-primary-foreground` | `primaryForeground` | `#ffffff` |
| `--color-secondary` | `secondary` | `#1e3a5f` |
| `--color-accent` | `accent` | `#3cb371` |
| `--color-background` | `background` | `#ffffff` |
| `--color-foreground` | `foreground` | `#000000` |
| `--color-card` | `card` | `#ffffff` |
| `--color-muted` | `muted` | `#f5f5f5` |
| `--color-muted-foreground` | `mutedForeground` | `#6b7280` |
| `--color-border` | `border` | `#e5e7eb` |
| `--color-destructive` | `destructive` | `#dc2626` |
| `--color-success` | `success` | `#22c55e` |
| `--color-warning` | `warning` | `#f59e0b` |
| `--color-info` | `info` | `#06b6d4` |

**Layout variables** (from `layout`, `typography`, `ui`):

| Variable | Source | Example |
|----------|--------|---------|
| `--layout-type` | `layout.type` | `sidebar-left` |
| `--sidebar-width` | `layout.sidebarWidth` | `256px` |
| `--header-height` | `layout.headerHeight` | `64px` |
| `--font-family` | `typography.fontFamily` | `system-ui` |
| `--font-size-base` | `typography.baseFontSize` | `16px` |
| `--line-height` | `typography.lineHeight` | `1.5` |
| `--radius-base` | `ui.borderRadius` | `1rem` |
| `--shadow-base` | `ui.shadowIntensity` | `0 1px 2px rgba(0,0,0,0.05)` |

**Element-specific variables** (from `elementStyles`):

Each element in `elementStyles` generates variables with a prefix. For example, the `card` element generates `--card-bg`, `--card-text`, `--card-border`, etc.

| Element Type | CSS Prefix | Example Variables |
|-------------|-----------|-------------------|
| `card` | `--card-` | `--card-bg`, `--card-text`, `--card-border`, `--card-radius` |
| `widget` | `--widget-` | `--widget-bg`, `--widget-text`, `--widget-shadow` |
| `sidebar` | `--sidebar-` | `--sidebar-bg`, `--sidebar-text` |
| `button-primary` | `--btn-primary-` | `--btn-primary-bg`, `--btn-primary-text` |
| `modal` | `--modal-` | `--modal-bg`, `--modal-border`, `--modal-blur` |
| `input` | `--input-` | `--input-bg`, `--input-border` |
| `home-background` | `--home-page-` | `--home-page-bg`, `--home-page-bg-image` |
| `home-welcome-banner` | `--home-welcome-` | `--home-welcome-bg`, `--home-welcome-text` |
| `home-chores-card` | `--home-chores-` | `--home-chores-bg`, `--home-chores-border` |
| `calendar-grid` | `--calendar-grid-` | `--calendar-grid-bg`, `--calendar-grid-text` |

Each element style can generate these suffixes: `-bg`, `-bg-image`, `-bg-opacity`, `-text`, `-font-size`, `-font-weight`, `-font-family`, `-border`, `-border-width`, `-radius`, `-border-style`, `-shadow`, `-blur`, `-opacity`, `-scale`, `-rotate`, `-glow-color`, `-glow-size`, `-padding`, `-hover-scale`, `-hover-opacity`, `-custom-css`.

### Creating a Theme via .habi-theme File

The `.habi-theme` format is a JSON file you can create in any text editor:

```json
{
  "formatVersion": "1.0",
  "manifest": {
    "name": "My Dark Theme",
    "description": "A sleek dark theme",
    "author": "Your Name",
    "version": "1.0.0",
    "tags": ["dark", "modern"],
    "previewColors": {
      "primary": "#818cf8",
      "accent": "#818cf8",
      "background": "#0f0f0f"
    }
  },
  "theme": {
    "layout": {
      "type": "sidebar-left",
      "sidebarWidth": 256,
      "headerHeight": 64,
      "navStyle": "icons-text"
    },
    "colorsLight": {
      "primary": "#6366f1", "primaryForeground": "#ffffff",
      "secondary": "#1e3a5f", "secondaryForeground": "#ffffff",
      "accent": "#6366f1", "accentForeground": "#ffffff",
      "background": "#ffffff", "foreground": "#000000",
      "card": "#ffffff", "cardForeground": "#000000",
      "muted": "#f5f5f5", "mutedForeground": "#6b7280",
      "destructive": "#dc2626", "destructiveForeground": "#ffffff",
      "success": "#22c55e", "successForeground": "#ffffff",
      "warning": "#f59e0b", "warningForeground": "#ffffff",
      "info": "#06b6d4", "infoForeground": "#ffffff",
      "border": "#e5e7eb", "ring": "#6366f1"
    },
    "colorsDark": {
      "primary": "#818cf8", "primaryForeground": "#000000",
      "secondary": "#94a3b8", "secondaryForeground": "#000000",
      "accent": "#818cf8", "accentForeground": "#000000",
      "background": "#0f0f0f", "foreground": "#f9fafb",
      "card": "#1a1a1a", "cardForeground": "#f9fafb",
      "muted": "#1f1f1f", "mutedForeground": "#9ca3af",
      "destructive": "#f87171", "destructiveForeground": "#ffffff",
      "success": "#4ade80", "successForeground": "#000000",
      "warning": "#fbbf24", "warningForeground": "#000000",
      "info": "#22d3ee", "infoForeground": "#000000",
      "border": "#2a2a2a", "ring": "#818cf8"
    },
    "typography": {
      "fontFamily": "system-ui, -apple-system, sans-serif",
      "baseFontSize": 16,
      "lineHeight": "normal",
      "fontWeight": "normal"
    },
    "pageBackground": { "type": "solid", "color": null },
    "ui": { "borderRadius": "large", "shadowIntensity": "subtle" },
    "icons": { "style": "outline" },
    "sidebar": null,
    "header": null,
    "elementStyles": null,
    "widgetOverrides": null,
    "loginPage": null,
    "lcarsMode": null
  },
  "assets": null
}
```

### Adding Per-Element Styles

The `elementStyles` object lets you style 40+ individual UI elements. Each key is a `ThemeableElement` type and the value is an `ElementStyle`:

```json
{
  "theme": {
    "elementStyles": {
      "card": {
        "backgroundColor": "rgba(255,255,255,0.05)",
        "borderColor": "rgba(255,255,255,0.1)",
        "borderRadius": 16,
        "customCSS": "backdrop-filter: blur(12px);"
      },
      "home-background": {
        "backgroundGradient": {
          "from": "#0f0f23",
          "to": "#1a1a3e",
          "direction": "to bottom right"
        }
      },
      "sidebar": {
        "backgroundColor": "#0d0d1a",
        "textColor": "#e0e0ff"
      },
      "button-primary": {
        "backgroundColor": "#818cf8",
        "textColor": "#000000",
        "borderRadius": 8,
        "hoverScale": 1.02
      }
    }
  }
}
```

**All available element types:**

| Category | Element Types |
|----------|--------------|
| **Global** | `page-background`, `sidebar`, `header`, `card`, `widget`, `button-primary`, `button-secondary`, `modal`, `input`, `login-page`, `kiosk` |
| **Home** | `home-background`, `home-title`, `home-welcome-banner`, `home-stats-widget`, `home-chores-card`, `home-events-card`, `home-weather-widget`, `home-leaderboard-widget`, `home-meals-widget` |
| **Calendar** | `calendar-background`, `calendar-title`, `calendar-grid`, `calendar-meal-widget`, `calendar-user-card` |
| **Chores** | `chores-background`, `chores-task-card`, `chores-paid-card` |
| **Shopping** | `shopping-background`, `shopping-filter-widget`, `shopping-list-card` |
| **Messages** | `messages-background`, `messages-announcements-card`, `messages-chat-card` |
| **Settings** | `settings-background`, `settings-nav-card`, `settings-content-card` |
| **Other Pages** | `budget-background`, `meals-background`, `recipes-background`, `paidchores-background`, `family-background` |

**All available ElementStyle properties:**

```typescript
{
  backgroundColor?: string;        // Solid color, e.g., "#1a1a2e" or "rgba(0,0,0,0.5)"
  backgroundGradient?: {           // CSS gradient
    from: string;
    to: string;
    direction?: string;            // "to bottom", "135deg", etc.
  };
  backgroundImage?: string;        // URL or data: URI
  backgroundOpacity?: number;      // 0–1, applied to bg color/gradient
  textColor?: string;
  textSize?: number;               // px
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
  fontFamily?: string;
  borderColor?: string;
  borderWidth?: number;            // px
  borderRadius?: number;           // px
  borderStyle?: string;            // "solid", "dashed", etc.
  boxShadow?: string;             // "none" | "subtle" | "medium" | "strong" or raw CSS
  blur?: number;                   // px (backdrop-filter blur)
  opacity?: number;                // 0–1
  scale?: number;                  // 1 = normal
  rotate?: number;                 // degrees
  skewX?: number;                  // degrees
  skewY?: number;                  // degrees
  glowColor?: string;
  glowSize?: number;               // px
  saturation?: number;             // percentage
  grayscale?: number;              // percentage
  hoverScale?: number;             // Scale on hover (1.02 = slight grow)
  hoverOpacity?: number;           // Opacity on hover
  padding?: string;                // CSS padding value
  customCSS?: string;              // Raw CSS (sanitized on import)
}
```

### CSS Selectors & Classes

Components opt into element theming via CSS classes or `data-theme-element` attributes:

| Element | CSS Class | Data Attribute |
|---------|-----------|---------------|
| Cards | `.themed-card` | `data-theme-element="card"` |
| Widgets | `.themed-widget` | `data-theme-element="widget"` |
| Primary buttons | `.themed-btn-primary` | `data-theme-element="button-primary"` |
| Secondary buttons | `.themed-btn-secondary` | `data-theme-element="button-secondary"` |
| Modals | `.themed-modal` | `data-theme-element="modal"` |
| Inputs | `.themed-input` | `data-theme-element="input"` |
| Home welcome | `.themed-home-welcome` | `data-theme-element="home-welcome-banner"` |
| Home chores | `.themed-home-chores` | `data-theme-element="home-chores-card"` |
| Calendar grid | `.themed-calendar-grid` | `data-theme-element="calendar-grid"` |

When your theme sets `elementStyles["home-chores-card"].backgroundColor = "#1a1a2e"`, the system sets `--home-chores-bg: #1a1a2e` on `:root`, and the component's CSS reads it: `background: var(--home-chores-bg, var(--card-bg))`.

### Importing the Theme

1. Save your file as `my-theme.habi-theme`
2. Go to **Store** page as an admin
3. Click **Import Theme**
4. Select the file — the server validates format, sanitizes CSS, and creates the theme

### Theme Security (Sanitization)

Imported themes are sanitized server-side. The following patterns are stripped from any `customCSS` field:
- External URLs (`url(https://...)`)
- `@import` directives
- `javascript:` URLs
- `expression()` (IE XSS)
- `-moz-binding` (Firefox XBL)
- `behavior` property (IE)

Base64 images are validated by checking magic bytes (png, jpg, gif, webp, svg, ico only). Max file size: 5 MB.

### .habi-theme Format Reference

| Section | Required | Description |
|---------|----------|-------------|
| `formatVersion` | Yes | Always `"1.0"` |
| `manifest` | Yes | Name (max 100 chars), author, version (semver), tags, preview colors |
| `theme` | Yes | Full definition: layout, colorsLight, colorsDark, typography, pageBackground, ui, icons (all required); sidebar, header, elementStyles, widgetOverrides, loginPage, lcarsMode (optional) |
| `assets` | No | Array of `{ assetType, filename, mimeType, url, data }` |

---

## Docker Architecture

HabiTrack uses **3 containers** managed by Docker Compose:

| Container | Image | Port | Purpose |
|-----------|-------|------|---------|
| `habitrack-db` | `mariadb:11` | 3306 | Database with persistent volume |
| `habitrack-api` | Custom (Node 22 Alpine) | 3000 | API server, migrations, git ops |
| `habitrack-web` | Custom (Nginx Alpine) | 8080 | Static frontend + reverse proxy |

### Why 3 Containers (Not 1)?

- **Database must be separate.** MariaDB is a completely different runtime from Node.js. It needs the official `mariadb:11` image for init scripts, health checks, and upgrades. Combining it with API would lose all of that.
- **Web (Nginx) serves a different purpose than API (Node).** The web container is a static file server with reverse proxy rules. The API runs a Node.js process. Combining them requires a process manager (supervisord) in one container — a Docker anti-pattern. Separate containers allow independent rebuild and scaling.
- **The `web` container is already optional.** It's behind the `web` profile — headless deployments skip it: `docker compose up -d` starts only `db` + `api`.

### Startup Sequence

```
db (MariaDB healthcheck passes)
  → api (runs migrate.js → starts Express)
    → web (serves frontend, proxies /api → api:3000) [optional]
```

---

## Project Structure

```
habitrack/
├── apps/
│   ├── api/                        # Express backend
│   │   └── src/
│   │       ├── routes/             # API endpoints
│   │       │   ├── auth/           # Authentication
│   │       │   ├── chores/         # Chores management
│   │       │   ├── shopping/       # Shopping lists
│   │       │   ├── calendar/       # Calendar events
│   │       │   ├── budgets/        # Budget tracking
│   │       │   ├── meals/          # Meal planning
│   │       │   ├── recipes/        # Recipe management
│   │       │   ├── themes/         # Theme system
│   │       │   └── ...
│   │       ├── middleware/         # Error handler, request logger
│   │       ├── services/           # Business logic
│   │       └── server.ts           # Entry point
│   └── web/                        # React frontend
│       └── src/
│           ├── api/                # API client
│           ├── components/         # UI components
│           │   ├── themes/         # Theme editor components
│           │   ├── dashboard/      # Dashboard widgets
│           │   ├── chores/         # Chores components
│           │   ├── settings/       # Settings tab components
│           │   ├── common/         # Shared components (modals, color pickers)
│           │   └── ...
│           ├── pages/              # Page components
│           ├── context/            # React contexts (Auth, Theme)
│           └── types/              # TypeScript type definitions
├── packages/                       # Shared workspace packages
├── providers/
│   └── storage-mariadb/
│       └── migrations/             # SQL migrations (auto-run on start)
├── docker/                         # Dockerfiles
├── docker-compose.yml
└── package.json
```

---

## Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=habitrackdb
DB_USER=habitrack
DB_PASSWORD=changeme

# API
API_PORT=3001
API_SECRET=change-this-to-a-long-random-string
SESSION_SECRET=change-this-too
CORS_ORIGIN=http://localhost:5173

# Frontend (build-time)
VITE_API_URL=http://localhost:3001/api
VITE_API_BASE_URL=http://localhost:3001

# Optional: Weather API
WEATHER_API_KEY=your-openweathermap-api-key
```

---

## User Roles

| Role     | Description                                                            |
| -------- | ---------------------------------------------------------------------- |
| `admin`  | Full access — manage members, chores, shopping, budgets, themes, settings |
| `member` | Standard access — own chores, shared lists, calendar, messaging        |
| `kid`    | Limited access — own chores and events, can request items, paid chores, kid-approved themes only |
| `kiosk`  | PIN-only login for shared screens, display-only                        |

---

## Theming System

HabiTrack includes a powerful theming system that goes beyond simple color changes:

### Theme Editor Features

- **Color Palette**: Customize primary, secondary, accent, background, card, muted, border, and semantic colors (success, warning, destructive)
- **Mode-Aware Colors**: Separate palettes for light and dark modes — the editor respects your current mode
- **Typography**: Choose font family, base size, and line height
- **UI Presets**: Border radius (none, small, medium, large) and shadow intensity (none, subtle, medium, strong)
- **Element Styles**: Per-element customization for cards, widgets, buttons, inputs, modals, sidebar
- **Page Backgrounds**: Set different backgrounds (solid, gradient, or image) for each of 14 pages
- **Animated Effects**: Add Matrix rain, snowfall, sparkle, bubbles, or embers to any page background
- **Live Preview**: See changes in real-time across 14 preview pages (Home, Chores, Calendar, Shopping, Messages, Settings, Budget, Meals, Recipes, Paid Chores, Family, Modal, Login, Kiosk)
- **Apply to All**: Quickly copy background settings from one page to multiple others
- **Media Library**: Upload and manage background images with category organization
- **Reset to Defaults**: Easily reset elements to theme defaults while preserving mode-awareness

### Default Themes

1. **HabiTrack Classic** — The official theme, cannot be modified (ensures a consistent fallback)
2. **Household Brand** — Your household's custom theme, fully customizable by admins

### Creating Themes

1. Go to **Settings → Themes**
2. Click **Create Theme** or **Duplicate** an existing theme
3. Use the theme editor to customize colors, typography, and element styles
4. Toggle between Light/Dark mode in the preview to customize both palettes
5. Preview your changes across different pages
6. Save and apply your theme

### Kid-Safe Themes

Admins can mark themes as "Approved for Kids" using the shield icon. Kids will only see and be able to use approved themes.

### Theme Structure

Themes are stored as JSON in the database and include:

```typescript
{
  name: string;
  description: string;
  layout: { type, sidebarWidth, navStyle };
  colorsLight: { primary, secondary, accent, background, card, muted, border, destructive, success, warning, ... };
  colorsDark: { primary, secondary, accent, background, card, muted, border, destructive, success, warning, ... };
  typography: { fontFamily, baseFontSize, lineHeight };
  ui: { borderRadius, shadowIntensity };
  sidebar: { backgroundType, backgroundColor, gradientFrom, gradientTo, imageUrl };
  pageBackground: { type, color, gradientFrom, gradientTo, imageUrl };
  elementStyles: {
    card: { borderRadius, boxShadow, ... },
    widget: { ... },
    'button-primary': { ... },
    // Per-page elements
    'dashboard-stats-widget': { ... },
    'calendar-grid': { ... },
    // ...
  };
  loginPage: { backgroundType, gradientFrom, gradientTo, ... };
}
```

### CSS Variables

The theme system uses CSS custom properties (variables) for all colors, making it easy to create consistent, mode-aware interfaces:

```css
/* Base colors */
--color-primary
--color-primary-foreground
--color-secondary
--color-secondary-foreground
--color-accent
--color-accent-foreground
--color-background
--color-foreground
--color-card
--color-card-foreground
--color-muted
--color-muted-foreground
--color-border

/* Semantic colors */
--color-destructive
--color-destructive-foreground
--color-success
--color-success-foreground
--color-warning
--color-warning-foreground

/* Per-page backgrounds */
--home-page-bg
--calendar-page-bg
--chores-page-bg
--shopping-page-bg
--messages-page-bg
--settings-page-bg
--budget-page-bg
--meals-page-bg
--recipes-page-bg
--paidchores-page-bg
--family-page-bg
```

### Advanced Theme Features

HabiTrack's theme editor includes powerful advanced features for deep customization:

#### Per-Page Background Customization

Each page in HabiTrack can have its own unique background:

1. Go to **Settings → Themes → Edit Theme**
2. Click on any page tab (Home, Calendar, Chores, Shopping, etc.)
3. Click on the page background area in the preview
4. Use the **Background** tab in the element editor to set:
   - **Solid color**: Pick any color for the background
   - **Gradient**: Create a gradient with custom colors and direction
   - **Image**: Upload or select from the media library
   - **Opacity**: Control image transparency (0-100%)

**Example: Create a gradient background for the Home page**
1. Select the Home page tab in the preview
2. Click on the page background
3. In the Background tab, select "Gradient"
4. Set "From" color to `#1a1a2e` and "To" color to `#16213e`
5. Choose direction (e.g., "to bottom right")
6. The preview updates in real-time

#### Apply to All Pages

To quickly apply the same background to multiple pages:

1. Configure the background on one page (e.g., Home)
2. Click the **"Apply to All"** button in the element editor
3. Select which pages should receive this background
4. Click Apply — all selected pages now share the same background

#### Advanced CSS Effects

HabiTrack includes animated background effects that can be combined:

| Effect | Description | Use Case |
|--------|-------------|----------|
| **Matrix Rain** | Digital falling characters (The Matrix style) | Tech/cyberpunk themes |
| **Snowfall** | Gentle falling snowflakes | Winter/holiday themes |
| **Sparkle** | Twinkling star effects | Magical/fantasy themes |
| **Bubbles** | Rising bubble animation | Underwater/aquatic themes |
| **Embers** | Floating glowing particles | Fire/warm themes |

**How to add effects:**

1. Select a page and click on its background
2. Go to the **Advanced** tab in the element editor
3. Toggle effects ON/OFF in the "Combinable CSS Effects" section
4. For Matrix Rain, choose a speed: Slow, Normal, Fast, or Very Fast
5. Effects are combinable — enable multiple for unique looks!

**Example: Matrix Rain + Sparkle combo**
```
In the Advanced tab:
- Toggle "Matrix Rain" ON
- Set speed to "Fast"
- Toggle "Sparkle" ON

The page now shows falling digital characters with twinkling stars.
```

#### Per-Element Styling

Beyond backgrounds, you can customize individual UI elements:

| Element | What You Can Style |
|---------|-------------------|
| **Cards** | Background, border radius, shadow, opacity |
| **Buttons** | Colors, hover states, border radius |
| **Inputs** | Border color, background, focus states |
| **Modals** | Background, backdrop blur, shadow |
| **Sidebar** | Background color, gradient, or image |
| **Widgets** | Individual dashboard widget styling |

**Example: Glass-morphism cards**
1. Select a card element in the preview
2. In the Background tab:
   - Set background color with low opacity (e.g., `rgba(255,255,255,0.1)`)
3. In the Effects tab:
   - Add backdrop blur (8px)
   - Add subtle shadow
4. In the Border tab:
   - Add a subtle border (e.g., `rgba(255,255,255,0.2)`)

#### Theme Preview Pages

The theme editor includes live previews for all pages:

| Page | What's Previewed |
|------|-----------------|
| **Home** | Dashboard widgets, stats, greeting |
| **Chores** | Chore cards, completion buttons, filters |
| **Calendar** | Calendar grid, events, day details |
| **Shopping** | Shopping lists, item cards, categories |
| **Messages** | Message list, announcements, DMs |
| **Settings** | Settings form, tabs, inputs |
| **Budget** | Budget cards, progress bars, entries |
| **Meals** | Meal planner grid, week view |
| **Recipes** | Recipe cards, ratings, cook time |
| **Paid Chores** | Reward amounts, claim buttons |
| **Family** | Member list, avatars, roles |
| **Modal** | Example modal dialogs |
| **Login** | Login form styling (admin only) |
| **Kiosk** | Kiosk PIN entry screen (admin only) |

#### Custom CSS (Power Users)

For advanced users, the Custom CSS field in the Advanced tab accepts special directives:

```css
/* Enable animated effects */
matrix-rain: true
matrix-rain-speed: fast    /* slow, normal, fast, veryfast */
snowfall: true
sparkle: true
bubbles: true
embers: true

/* Combine multiple effects */
matrix-rain: true
matrix-rain-speed: slow
sparkle: true
```

---

## API Overview

HabiTrack provides a RESTful API for all operations:

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/creds/login` | Login with username/password |
| `POST /api/auth/pin/login` | Login with PIN (kiosk mode) |
| `GET /api/me` | Get current user |
| `GET /api/chores` | List chores |
| `GET /api/shopping/items` | List shopping items |
| `PATCH /api/shopping/items/:id` | Update shopping item (inline edit) |
| `GET /api/calendar/events` | List calendar events |
| `GET /api/budgets` | List budgets |
| `GET /api/budgets/:id/entries` | List budget entries |
| `GET /api/themes` | List available themes |
| `POST /api/themes` | Create a new theme |
| `PUT /api/themes/:id` | Update a theme |
| `POST /api/themes/:id/duplicate` | Duplicate a theme |
| `PUT /api/themes/:id/kid-approval` | Toggle kid approval for a theme |
| ... | See API source for full documentation |

---

## Security Notice

This application is designed to run on your **local home network**. If you expose it to the internet:

- Always use HTTPS (SSL/TLS)
- Use strong, unique passwords
- Keep the software updated
- Consider using a VPN instead of exposing directly
- The developer assumes no liability for security issues (see LICENSE)

---

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

### Development Setup

1. Fork the repository
2. Clone your fork
3. Install dependencies: `pnpm install`
4. Start the database: `docker compose up -d db`
5. Start the API: `pnpm -F api dev`
6. Start the web app: `pnpm -F web dev`
7. Make your changes
8. Submit a pull request

---

## Credits

### Author
- **BeachFury** — Creator and lead developer

### Contributors
- **Claude** (Anthropic) — AI pair programming assistant

---

## License

Copyright (c) 2025 BeachFury. All Rights Reserved.

This software is proprietary. See [LICENSE](LICENSE) for full terms.

**No warranty is provided. Use at your own risk.**

---

## Support

- **Issues**: [GitHub Issues](https://github.com/beachfury/HabiTrack/issues)
- **Discussions**: [GitHub Discussions](https://github.com/beachfury/HabiTrack/discussions)

---

<p align="center">
  Made with ❤️ for families everywhere
</p>
