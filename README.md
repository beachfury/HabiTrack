# HabiTrack

A self-hosted family household management app — chores, shopping, calendar, messaging, and more — built for a single household running on your own server.

## Features

- **Chores** — Templates, recurring schedules, per-member assignments, completion tracking with points and streaks, leaderboard
- **Shopping** — Shared lists with categories, store tracking, price history, product catalog, member requests and admin approval
- **Calendar** — Family calendar with multi-day events, per-member color coding, day-detail view
- **Messaging** — Notifications, admin announcements, direct messages between family members
- **Family Management** — Add/edit members, assign roles, set passwords and kiosk PINs
- **Gamification** — Points for chore completion, adjustable by admins, leaderboard rankings
- **Theming** — Light/dark/system mode, accent color picker (per-user)
- **Kiosk Mode** — PIN-based quick login for shared household screens
- **Multi-role** — Admin, member, kid, and kiosk roles with granular permissions
- **Self-hosted** — Docker Compose stack: API + frontend + MariaDB, all on your network

## Tech Stack

| Layer     | Technology                                                        |
| --------- | ----------------------------------------------------------------- |
| Frontend  | React 18, TypeScript, Vite, Tailwind CSS v4                       |
| Backend   | Node.js, Express, TypeScript                                      |
| Database  | MariaDB 11 (MySQL-compatible)                                     |
| Auth      | Argon2id password hashing, HTTP-only session cookies, CSRF tokens |
| Container | Docker + Docker Compose                                           |
| Monorepo  | pnpm workspaces                                                   |

## Quick Start

### Prerequisites

- [Docker](https://www.docker.com/get-started) and Docker Compose
- [Node.js](https://nodejs.org/) v18+ (for local dev only)
- [pnpm](https://pnpm.io/) package manager (for local dev only)

### Running with Docker (recommended)

```bash
git clone https://github.com/yourusername/habitrack.git
cd habitrack
cp .env.example .env          # edit DB passwords, API_SECRET, etc.
docker-compose up -d
```

On first launch the API runs all migrations automatically. Open the app and complete the bootstrap wizard to create the admin account.

| Service  | Default URL           |
| -------- | --------------------- |
| Frontend | http://localhost:3000 |
| API      | http://localhost:3001 |

### Local Development

```bash
pnpm install                   # install all workspace deps
docker-compose up -d db        # start MariaDB only
pnpm -F api dev                # start API with ts-node (terminal 1)
pnpm -F web dev                # start Vite dev server (terminal 2)
```

Migrations run automatically when the API starts.

## Project Structure

```
habitrack/
├── apps/
│   ├── api/                        # Express backend
│   │   └── src/
│   │       ├── routes/
│   │       │   ├── admin/          # User creation, impersonation
│   │       │   ├── auth/           # Login, register, PIN, password reset, onboard
│   │       │   ├── calendar/       # Events CRUD
│   │       │   ├── chores/         # Categories, templates, definitions, instances, assignments, stats
│   │       │   ├── family/         # Member CRUD, password/PIN management
│   │       │   ├── messages/       # Notifications, announcements, direct messages
│   │       │   ├── settings/       # User prefs, household config
│   │       │   └── shopping/       # Lists, catalog, stores, categories, suggestions, requests
│   │       ├── middleware/         # Error handler, request logger
│   │       ├── services/          # Calendar reminders
│   │       ├── notify/            # Email (SMTP) and dev notification providers
│   │       ├── utils/             # Auth, validation, date, response helpers
│   │       ├── types/             # Shared API types
│   │       ├── router.ts          # All route registrations
│   │       └── server.ts          # Express app entry point
│   └── web/                        # React frontend
│       └── src/
│           ├── api/               # Typed API client (auth, calendar, chores, family, messages, settings, shopping, upload)
│           ├── components/
│           │   ├── calendar/      # CalendarGrid, CalendarHeader, DayDetailModal, EventFormModal
│           │   ├── chores/        # MyChoresView, AllChoresView, ManageView, LeaderboardView, modals
│           │   ├── common/        # Alert, Avatar, Badge, Button, Card, ColorPicker, Input, Modal, Spinner
│           │   ├── family/        # MemberCard, MemberFormModal, PasswordModal, PinModal
│           │   ├── settings/      # AppearanceTab, HouseholdTab, ProfileTab, SecurityTab
│           │   └── shopping/      # ShoppingListTab, CatalogTab, ManageTab, modals
│           ├── context/           # AuthContext, ThemeContext
│           ├── hooks/             # useClickOutside, useDebounce, useLocalStorage
│           ├── pages/             # CalendarPage, ChoresPage, FamilyPage, HomePage, LoginPage, MessagesPage, SettingsPage, ShoppingPage, SetupPage, KioskLoginPage
│           ├── types/             # TypeScript interfaces (api, calendar, chores, messages, shopping, user)
│           └── utils/             # colors, format helpers
├── packages/                       # Shared workspace packages
│   ├── core-config/               # Shared configuration
│   ├── http/                      # HTTP utilities
│   ├── http-contracts/            # API schemas (auth, bootstrap, chores, kiosk, permissions)
│   ├── kiosk/                     # Kiosk mode utilities
│   ├── net/                       # Network utilities
│   ├── perm/                      # Permission engine + default role seeds
│   └── session-store/             # Session store implementation
├── providers/
│   └── storage-mariadb/
│       └── migrations/            # Numbered SQL migrations (001–016)
├── docker/
│   ├── api/Dockerfile
│   ├── web/Dockerfile + nginx.conf
│   └── db/                        # MariaDB init scripts + config
├── scripts/                       # Dev utilities (snapshot, cleanup)
├── docker-compose.yml
├── docker-compose.override.yml
├── pnpm-workspace.yaml
└── package.json
```

## Database Migrations

Migrations live in `providers/storage-mariadb/migrations/` and run in order on API startup.

| #   | File                          | Description                                    |
| --- | ----------------------------- | ---------------------------------------------- |
| 001 | `core_settings_users.sql`     | Settings table, users table                    |
| 002 | `auth_tables.sql`             | Credentials, sessions, login attempts          |
| 003 | `permissions_security.sql`    | Permissions, audit log                         |
| 004 | `notifications_messages.sql`  | Notification system                            |
| 005 | `calendar_events.sql`         | Calendar events                                |
| 006 | `chores_core.sql`             | Chore categories, templates, definitions       |
| 007 | `chores_instances.sql`        | Chore instances, points, streaks               |
| 008 | `achievements.sql`            | Gamification achievements                      |
| 009 | `shopping.sql`                | Shopping lists, catalog, stores, price history |
| 010 | `default_chore_templates.sql` | Seed: built-in chore templates                 |
| 011 | `default_catalog_items.sql`   | Seed: common grocery catalog items             |
| 012 | `color_swatches.sql`          | Color palette reference                        |
| 013 | `fix_households_audit.sql`    | Schema fix for household/audit tables          |
| 014 | `points_adjustments.sql`      | Admin point adjustment tracking                |
| 015 | `direct_messages.sql`         | Direct messaging tables                        |
| 016 | `messages_direct_columns.sql` | DM column additions                            |

## API Routes

All routes are prefixed with `/api`.

### Auth

| Method | Path                     | Auth | Description                     |
| ------ | ------------------------ | ---- | ------------------------------- |
| POST   | `/auth/login`            | —    | Dev/simple login                |
| POST   | `/auth/creds/register`   | —    | Register with email + password  |
| POST   | `/auth/creds/login`      | —    | Email + password login          |
| POST   | `/auth/creds/change`     | ✓    | Change own password             |
| POST   | `/auth/creds/forgot`     | —    | Request password reset email    |
| POST   | `/auth/creds/reset`      | —    | Complete password reset         |
| GET    | `/auth/pin/users`        | —    | List PIN-eligible users (kiosk) |
| POST   | `/auth/pin/login`        | —    | Login with PIN                  |
| POST   | `/auth/pin/verify`       | —    | Verify PIN                      |
| GET    | `/auth/session`          | —    | Check session status            |
| POST   | `/auth/logout`           | —    | Logout                          |
| GET    | `/me`                    | ✓    | Get current user                |
| POST   | `/auth/onboard/complete` | ✓    | Complete first-login onboarding |

### Bootstrap

| Method | Path                | Auth | Description                  |
| ------ | ------------------- | ---- | ---------------------------- |
| GET    | `/bootstrap/status` | —    | Check if app is bootstrapped |
| POST   | `/bootstrap`        | —    | Initial setup                |
| POST   | `/bootstrap/admin`  | —    | Create first admin account   |

### Admin

| Method | Path                         | Auth  | Description                |
| ------ | ---------------------------- | ----- | -------------------------- |
| POST   | `/admin/users`               | admin | Create user                |
| POST   | `/admin/impersonate/:userId` | admin | Start impersonation        |
| POST   | `/admin/impersonate/stop`    | ✓     | Stop impersonation         |
| GET    | `/admin/impersonate/status`  | ✓     | Check impersonation status |

### Settings

| Method | Path                       | Auth  | Description                     |
| ------ | -------------------------- | ----- | ------------------------------- |
| GET    | `/settings/user`           | ✓     | Get user preferences            |
| PUT    | `/settings/user`           | ✓     | Update user preferences         |
| POST   | `/settings/password`       | ✓     | Change password (settings flow) |
| POST   | `/settings/avatar`         | ✓     | Upload avatar                   |
| DELETE | `/settings/avatar`         | ✓     | Remove avatar                   |
| GET    | `/settings/household`      | admin | Get household settings          |
| PUT    | `/settings/household`      | admin | Update household settings       |
| POST   | `/settings/household/logo` | admin | Upload household logo           |
| DELETE | `/settings/household/logo` | admin | Remove household logo           |

### Family

| Method | Path                           | Auth  | Description         |
| ------ | ------------------------------ | ----- | ------------------- |
| GET    | `/family/members`              | ✓     | List all members    |
| GET    | `/family/members/:id`          | ✓     | Get single member   |
| POST   | `/family/members`              | admin | Create member       |
| PUT    | `/family/members/:id`          | admin | Update member       |
| DELETE | `/family/members/:id`          | admin | Deactivate member   |
| POST   | `/family/members/:id/password` | admin | Set member password |
| POST   | `/family/members/:id/pin`      | admin | Set member PIN      |
| DELETE | `/family/members/:id/pin`      | admin | Remove member PIN   |

### Calendar

| Method | Path                   | Auth | Description                       |
| ------ | ---------------------- | ---- | --------------------------------- |
| GET    | `/calendar/events`     | ✓    | List events (with date range)     |
| GET    | `/calendar/users`      | ✓    | List users for calendar dropdowns |
| POST   | `/calendar/events`     | ✓    | Create event                      |
| PUT    | `/calendar/events/:id` | ✓    | Update event                      |
| DELETE | `/calendar/events/:id` | ✓    | Delete event                      |

### Chores

| Method | Path                              | Auth  | Description                   |
| ------ | --------------------------------- | ----- | ----------------------------- |
| GET    | `/chores`                         | ✓     | List chore definitions        |
| GET    | `/chores/:id`                     | ✓     | Get single chore              |
| POST   | `/chores`                         | admin | Create chore                  |
| PUT    | `/chores/:id`                     | admin | Update chore                  |
| DELETE | `/chores/:id`                     | admin | Soft-delete chore             |
| DELETE | `/chores/:id/hard`                | admin | Hard-delete chore             |
| POST   | `/chores/:id/regenerate`          | admin | Regenerate instances          |
| GET    | `/chores/categories`              | ✓     | List categories               |
| POST   | `/chores/categories`              | admin | Create category               |
| PATCH  | `/chores/categories/:id`          | admin | Update category               |
| DELETE | `/chores/categories/:id`          | admin | Delete category               |
| GET    | `/chores/templates`               | ✓     | List templates                |
| GET    | `/chores/templates/:id`           | ✓     | Get template                  |
| POST   | `/chores/templates`               | admin | Create template               |
| PUT    | `/chores/templates/:id`           | admin | Update template               |
| DELETE | `/chores/templates/:id`           | admin | Delete template               |
| POST   | `/chores/templates/:id/apply`     | admin | Apply template → create chore |
| GET    | `/chores/instances`               | ✓     | List instances                |
| POST   | `/chores/instances/:id/complete`  | ✓     | Complete instance             |
| POST   | `/chores/instances/:id/approve`   | admin | Approve completion            |
| POST   | `/chores/instances/:id/reject`    | admin | Reject completion             |
| POST   | `/chores/instances/:id/skip`      | admin | Skip instance                 |
| POST   | `/chores/instances/:id/reassign`  | admin | Reassign instance             |
| GET    | `/chores/stats`                   | ✓     | Get chore statistics          |
| GET    | `/chores/leaderboard`             | ✓     | Get points leaderboard        |
| POST   | `/chores/points/adjust`           | admin | Adjust member points          |
| GET    | `/chores/assignments`             | admin | List assignments              |
| DELETE | `/chores/assignments/:id`         | admin | Delete assignment             |
| POST   | `/chores/assignments/bulk-delete` | admin | Bulk delete assignments       |

### Shopping

| Method | Path                                    | Auth  | Description              |
| ------ | --------------------------------------- | ----- | ------------------------ |
| GET    | `/shopping/list`                        | ✓     | Get shopping list        |
| POST   | `/shopping/list`                        | ✓     | Add item to list         |
| PUT    | `/shopping/list/:id`                    | ✓     | Update list item         |
| DELETE | `/shopping/list/:id`                    | ✓     | Remove from list         |
| POST   | `/shopping/list/:id/purchase`           | ✓     | Mark item purchased      |
| GET    | `/shopping/catalog`                     | ✓     | List catalog items       |
| GET    | `/shopping/catalog/:id`                 | ✓     | Get catalog item         |
| GET    | `/shopping/catalog/:id/prices`          | ✓     | Get price history        |
| POST   | `/shopping/catalog`                     | admin | Create catalog item      |
| PUT    | `/shopping/catalog/:id`                 | admin | Update catalog item      |
| DELETE | `/shopping/catalog/:id`                 | admin | Delete catalog item      |
| POST   | `/shopping/catalog/:id/prices`          | ✓     | Record a price           |
| GET    | `/shopping/categories`                  | ✓     | List shopping categories |
| POST   | `/shopping/categories`                  | admin | Create category          |
| PUT    | `/shopping/categories/:id`              | admin | Update category          |
| DELETE | `/shopping/categories/:id`              | admin | Delete category          |
| GET    | `/shopping/stores`                      | ✓     | List stores              |
| POST   | `/shopping/stores`                      | admin | Create store             |
| POST   | `/shopping/stores/request`              | ✓     | Request new store        |
| GET    | `/shopping/stores/requests`             | admin | List store requests      |
| POST   | `/shopping/stores/requests/:id/approve` | admin | Approve store            |
| POST   | `/shopping/stores/requests/:id/deny`    | admin | Deny store               |
| GET    | `/shopping/suggestions`                 | ✓     | Get smart suggestions    |
| POST   | `/shopping/suggestions/:id/add`         | ✓     | Add suggestion to list   |
| POST   | `/shopping/suggestions/add-all`         | ✓     | Add all suggestions      |
| GET    | `/shopping/requests`                    | ✓     | List item requests       |
| POST   | `/shopping/requests`                    | ✓     | Create item request      |
| POST   | `/shopping/requests/:id/approve`        | admin | Approve request          |
| POST   | `/shopping/requests/:id/deny`           | admin | Deny request             |
| GET    | `/shopping/history`                     | ✓     | Purchase history         |
| GET    | `/shopping/analytics`                   | ✓     | Spending analytics       |

### Messages

| Method | Path                               | Auth  | Description                        |
| ------ | ---------------------------------- | ----- | ---------------------------------- |
| GET    | `/messages`                        | ✓     | List notifications                 |
| GET    | `/messages/unread-count`           | ✓     | Unread notification count          |
| GET    | `/messages/unread-total`           | ✓     | Total unread (notifications + DMs) |
| POST   | `/messages/:id/read`               | ✓     | Mark notification read             |
| POST   | `/messages/read-all`               | ✓     | Mark all read                      |
| DELETE | `/messages/:id`                    | ✓     | Delete notification                |
| DELETE | `/messages`                        | ✓     | Delete all read                    |
| GET    | `/messages/announcements`          | ✓     | List announcements                 |
| POST   | `/messages/announcements`          | admin | Create announcement                |
| POST   | `/messages/announcements/:id/read` | ✓     | Mark announcement read             |
| DELETE | `/messages/announcements/:id`      | admin | Delete announcement                |
| GET    | `/messages/conversations`          | ✓     | List DM conversations              |
| GET    | `/messages/conversations/:userId`  | ✓     | Get conversation with user         |
| POST   | `/messages/send`                   | ✓     | Send direct message                |
| DELETE | `/messages/direct/:id`             | ✓     | Delete single DM                   |
| DELETE | `/messages/conversations/:userId`  | ✓     | Delete conversation                |

### Uploads

| Method | Path                  | Auth  | Description             |
| ------ | --------------------- | ----- | ----------------------- |
| POST   | `/upload/avatar`      | ✓     | Upload user avatar      |
| DELETE | `/upload/avatar`      | ✓     | Delete user avatar      |
| POST   | `/upload/logo`        | admin | Upload household logo   |
| POST   | `/upload/background`  | admin | Upload login background |
| GET    | `/uploads`            | admin | List all uploads        |
| DELETE | `/uploads/:id`        | admin | Delete upload           |
| POST   | `/uploads/:id/select` | admin | Set upload as active    |

### Other

| Method | Path                   | Auth  | Description         |
| ------ | ---------------------- | ----- | ------------------- |
| GET    | `/permissions`         | admin | List permissions    |
| PUT    | `/permissions`         | admin | Replace permissions |
| POST   | `/permissions/refresh` | admin | Reload permissions  |
| GET    | `/colors/*`            | —     | Color swatch API    |

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
CORS_ORIGIN=http://localhost:3000

# Frontend (build-time)
VITE_API_URL=http://localhost:3001/api
VITE_API_BASE_URL=http://localhost:3001
```

## User Roles

| Role     | Description                                                             |
| -------- | ----------------------------------------------------------------------- |
| `admin`  | Full access — manage members, chores, shopping, settings, impersonation |
| `member` | Standard access — own chores, shared lists, calendar, messaging         |
| `kid`    | Limited access — own chores and events, can request items               |
| `kiosk`  | PIN-only login for shared screens, display-only                         |

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.
