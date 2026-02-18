# HabiTrack - Docker Deployment

## Quick Start

### 1. Configure Environment (IMPORTANT!)

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and CHANGE THESE PASSWORDS:
# - DB_ROOT_PASSWORD (MariaDB root user password)
# - DB_PASSWORD (HabiTrack application database password)
```

> ⚠️ **Security Note**: Each installation MUST use unique passwords. The default
> passwords in docker-compose.yml are placeholder values and should NEVER be
> used in production. Always create a `.env` file with your own secure passwords.

### 2. Start Everything

```bash
docker-compose up -d
```

### 3. Access the Application

- **Web UI**: http://localhost:8080
- **API**: http://localhost:3000
- **Database**: localhost:3306

---

## Services

| Service | Port | Description |
|---------|------|-------------|
| `web` | 8080 | Frontend (Nginx + React) |
| `api` | 3000 | Backend API (Node.js) |
| `db` | 3306 | MariaDB Database |

---

## Commands

### Start all services
```bash
docker-compose up -d
```

### Stop all services
```bash
docker-compose down
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
```

### Rebuild after code changes
```bash
docker-compose up -d --build
```

### Reset database (WARNING: deletes all data)
```bash
docker-compose down -v
docker-compose up -d
```

---

## Configuration

All configuration is done via environment variables in the `.env` file.

### Required Variables (Must Change!)

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_ROOT_PASSWORD` | MariaDB root password | ⚠️ **MUST CHANGE** |
| `DB_PASSWORD` | App database password | ⚠️ **MUST CHANGE** |
| `HABITRACK_BASE_URL` | Public URL of the app | http://localhost:8080 |

> **Why unique passwords matter**: If everyone uses the same default passwords,
> anyone who downloads HabiTrack could potentially access your database if your
> server is exposed. Generate unique passwords for your installation.

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `WEB_PORT` | Web UI port | 8080 |
| `API_PORT` | API port | 3000 |
| `DB_PORT` | Database port | 3306 |
| `HABITRACK_ENV` | Environment mode (development/production) | production |
| `HABITRACK_LOG_LEVEL` | Log level (debug, info, warn, error) | info |

See `.env.example` for all available options.

### HTTP vs HTTPS (Important!)

**For local network access over HTTP** (no SSL/HTTPS), set:
```env
HABITRACK_ENV=development
```

This configures cookies to work over HTTP. Without this setting, authentication will fail because secure cookies require HTTPS.

**For production with HTTPS**, use the default:
```env
HABITRACK_ENV=production
```

This enables secure cookies and other production security features.

---

## Data Persistence

Database data is stored in a Docker volume called `habitrack-db-data`.

### Backup Database
```bash
docker exec habitrack-db mariadb-dump -u root -p habitrack > backup.sql
```

### Restore Database
```bash
docker exec -i habitrack-db mariadb -u root -p habitrack < backup.sql
```

---

## Reverse Proxy (Nginx/Traefik)

If running behind a reverse proxy, update these settings in `.env`:

```env
HABITRACK_BASE_URL=https://habitrack.yourdomain.com
HABITRACK_ALLOWED_ORIGINS=https://habitrack.yourdomain.com
HABITRACK_COOKIE_SECURE=true
HABITRACK_TRUSTED_PROXIES=10.0.0.0/8,172.16.0.0/12,192.168.0.0/16
```

---

## Unraid Deployment

1. Install the "Docker Compose Manager" plugin
2. Create a new stack called "habitrack"
3. Paste the contents of `docker-compose.yml`
4. Set environment variables in the Unraid UI
5. Start the stack

Or use the Community Applications template (coming soon).

---

## Troubleshooting

### API can't connect to database
```bash
# Check if database is healthy
docker-compose ps

# View database logs
docker-compose logs db
```

### Permission denied errors
```bash
# Ensure volumes have correct permissions
docker-compose down
docker volume rm habitrack-db-data
docker-compose up -d
```

### Reset everything
```bash
docker-compose down -v --rmi all
docker-compose up -d --build
```

---

## Development

For local development without Docker:

```bash
# Start only the database
docker-compose up -d db

# Run API locally
cd apps/api
pnpm dev

# Run frontend locally
cd apps/web
pnpm dev
```
