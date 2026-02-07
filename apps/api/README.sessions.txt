# HabiTrack API — Real Sessions (dev login)

Adds:
- `@habitrack/session-store` (MariaDB-backed)
- Express routes:
  - `POST /api/auth/login`  (dev: accepts `{ role }`)
  - `GET  /api/auth/me`
  - `POST /api/auth/logout`
- Middleware `sessionLoader` to populate req.__habitrackSession

## Wire into apps/api/src/server.ts
1) import and use the middleware before your routes:
```ts
import { sessionLoader, postLogin, getMe, postLogout } from './routes.auth';
app.use(sessionLoader);
```

2) add routes:
```ts
app.post('/api/auth/login', postLogin);
app.get('/api/auth/me', getMe);
app.post('/api/auth/logout', postLogout);
```

3) tweak your Context builder to use the cookie-backed session:
```ts
function makeContext(req: express.Request): Context {
  const dev = getDevSessionFromHeader(req);
  const cookieSess = (req as any).__habitrackSession || null;
  const session: Session = cookieSess ?? dev; // prefer cookie session
  return {
    session,
    isLocalRequest: classifyWithLoopbackFix(req).isLocal,
    isBootstrapped: true,
    getRoleRules,
  };
}
```

## DB schema (ensure this exists)
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

## Test
```powershell
Invoke-RestMethod "http://localhost:3000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"role":"member"}' -SessionVariable S
Invoke-RestMethod "http://localhost:3000/api/auth/me" -WebSession $S
Invoke-RestMethod "http://localhost:3000/api/chores" -WebSession $S
Invoke-RestMethod "http://localhost:3000/api/auth/logout" -Method POST -WebSession $S
```

This login is temporary for development. Next pass: real credential verification (password/PIN with Argon2) and removing `x-demo-role`.
