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
- **Per-page backgrounds** — different backgrounds for each section of the app
- **Page-specific element overrides** — style the calendar grid differently than the chores card
- **Background images** with opacity control and media library
- **Typography control** — custom fonts, sizes, line heights
- **Border radius and shadow** presets
- **Live preview** in the theme editor with all app pages
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

### 🖥️ Kiosk Mode
- PIN-based quick login for shared household screens
- Simplified display-focused interface
- Perfect for wall-mounted tablets or kitchen displays

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
| Frontend  | React 18, TypeScript, Vite, Tailwind CSS v4                       |
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
# Prerequisites: Node.js 18+, pnpm, Docker

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

#### Using with Unraid's Reverse Proxy (SWAG/NPM)

If you use SWAG or Nginx Proxy Manager:

1. Point your domain to your Unraid IP
2. Create a proxy host for HabiTrack
3. Forward to `http://YOUR-UNRAID-IP:3000`
4. Add a custom location for `/api` → `http://YOUR-UNRAID-IP:3001`
5. Enable SSL

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
- **Page Backgrounds**: Set different backgrounds (solid, gradient, or image) for each page
- **Live Preview**: See changes in real-time across all preview pages (Home, Calendar, Chores, Shopping, Messages, Settings, Login)
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
