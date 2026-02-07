# @habitrack/session-store

Minimal DB-backed session store for HabiTrack APIs (MariaDB).

**Schema expected**
```sql
CREATE TABLE IF NOT EXISTS sessions (
  sid          VARCHAR(255) PRIMARY KEY,
  user_id      BIGINT NOT NULL,
  role         VARCHAR(16) NOT NULL,
  created_at   DATETIME NOT NULL,
  last_seen_at DATETIME NOT NULL,
  expires_at   DATETIME NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions (expires_at);
```
