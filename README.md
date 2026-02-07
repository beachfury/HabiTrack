# HabiTrack

A self-hosted family household management app — chores, shopping, calendar, budgets, messaging, and more — built for a single household running on your own server.

## Features

- **Dashboard** — Customizable drag-and-drop widgets showing events, chores, weather, leaderboards, and more
- **Chores** — Templates, recurring schedules, per-member assignments, completion tracking with points and streaks, leaderboard
- **Paid Chores** — Extra tasks kids can claim for money, with approval workflow
- **Shopping** — Shared lists with categories, store tracking, price history, product catalog, member requests and admin approval
- **Calendar** — Family calendar with multi-day events, per-member color coding, day-detail view
- **Budgets** — Admin-only budget tracking for bills, expenses, and household spending (electric, water, fuel, insurance, etc.)
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

---

## Server Deployment Guide

### Prerequisites

- A Linux server (Ubuntu 20.04+, Debian 11+, or similar)
- [Docker](https://docs.docker.com/engine/install/) and [Docker Compose](https://docs.docker.com/compose/install/)
- A domain name (optional, but recommended for HTTPS)
- At least 1GB RAM and 10GB disk space

### Step 1: Install Docker (if not installed)

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

### Step 2: Clone the Repository

```bash
cd /opt
sudo git clone https://github.com/beachfury/HabiTrack.git habitrack
sudo chown -R $USER:$USER habitrack
cd habitrack
```

### Step 3: Configure Environment

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

### Step 4: Start the Application

```bash
# Build and start all containers
docker compose up -d

# Check if containers are running
docker compose ps

# View logs
docker compose logs -f
```

### Step 5: Initial Setup

1. Open your browser and go to `http://your-server-ip:3000`
2. Complete the bootstrap wizard to create your admin account
3. Start adding family members!

---

## Production Deployment (with HTTPS)

For production use with a domain name and SSL certificate:

### Using Nginx as Reverse Proxy

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

## Managing the Application

### Common Commands

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

### Updating HabiTrack

```bash
cd /opt/habitrack

# Pull latest changes
git pull

# Rebuild and restart
docker compose down
docker compose up -d --build
```

### Database Backup

```bash
# Backup
docker compose exec db mysqldump -u root -p habitrackdb > backup_$(date +%Y%m%d).sql

# Restore
docker compose exec -T db mysql -u root -p habitrackdb < backup_file.sql
```

### Troubleshooting

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

## Unraid Installation

### Option 1: Using Docker Compose (Recommended)

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

### Option 2: Manual Docker Containers

If you prefer to set up containers manually through the Unraid Docker UI:

#### Container 1: MariaDB Database

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

#### Container 2: HabiTrack API

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

#### Container 3: HabiTrack Web

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

### Data Persistence on Unraid

Store your data in `/mnt/user/appdata/habitrack/`:

```
/mnt/user/appdata/habitrack/
├── db/          # MariaDB data
├── uploads/     # User uploads (avatars, logos)
└── .env         # Environment configuration
```

### Using with Unraid's Reverse Proxy (SWAG/NPM)

If you use SWAG or Nginx Proxy Manager:

1. Point your domain to your Unraid IP
2. Create a proxy host for HabiTrack
3. Forward to `http://YOUR-UNRAID-IP:3000`
4. Add a custom location for `/api` → `http://YOUR-UNRAID-IP:3001`
5. Enable SSL

---

## Local Development

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [pnpm](https://pnpm.io/) package manager
- Docker (for the database)

### Setup

```bash
# Install dependencies
pnpm install

# Start MariaDB only
docker compose up -d db

# Start API (terminal 1)
pnpm -F api dev

# Start frontend (terminal 2)
pnpm -F web dev
```

Migrations run automatically when the API starts.

| Service  | Default URL           |
| -------- | --------------------- |
| Frontend | http://localhost:3000 |
| API      | http://localhost:3001 |

---

## Project Structure

```
habitrack/
├── apps/
│   ├── api/                        # Express backend
│   │   └── src/
│   │       ├── routes/             # API endpoints
│   │       ├── middleware/         # Error handler, request logger
│   │       ├── services/           # Business logic
│   │       └── server.ts           # Entry point
│   └── web/                        # React frontend
│       └── src/
│           ├── api/                # API client
│           ├── components/         # UI components
│           ├── pages/              # Page components
│           └── context/            # React contexts
├── packages/                       # Shared workspace packages
├── providers/
│   └── storage-mariadb/
│       └── migrations/             # SQL migrations
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
CORS_ORIGIN=http://localhost:3000

# Frontend (build-time)
VITE_API_URL=http://localhost:3001/api
VITE_API_BASE_URL=http://localhost:3001
```

---

## User Roles

| Role     | Description                                                            |
| -------- | ---------------------------------------------------------------------- |
| `admin`  | Full access — manage members, chores, shopping, budgets, settings      |
| `member` | Standard access — own chores, shared lists, calendar, messaging        |
| `kid`    | Limited access — own chores and events, can request items, paid chores |
| `kiosk`  | PIN-only login for shared screens, display-only                        |

---

## Security Notice

This application is designed to run on your **local home network**. If you expose it to the internet:

- Always use HTTPS (SSL/TLS)
- Use strong passwords
- Keep the software updated
- Consider using a VPN instead of exposing directly
- The developer assumes no liability for security issues (see LICENSE)

---

## License

Copyright (c) 2025 BeachFury. All Rights Reserved.

This software is proprietary. See [LICENSE](LICENSE) for full terms.

**No warranty is provided. Use at your own risk.**
