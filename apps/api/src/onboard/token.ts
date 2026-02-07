// apps/api/src/onboard/token.ts
import crypto from 'node:crypto';

// very small HMAC’d payload { uid, exp, purpose }
const SECRET = process.env.ONBOARD_TOKEN_SECRET ?? 'dev-onboard-secret';

export function makeOnboardToken(userId: number, purpose: 'onboard', expMs: number) {
  const payload = JSON.stringify({ uid: userId, purpose, exp: expMs });
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}.${sig}`, 'utf8').toString('base64url');
}

export function readOnboardToken(token: string): { userId: number } | null {
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf8');
    const dot = raw.lastIndexOf('.');
    if (dot < 0) return null;
    const payload = raw.slice(0, dot);
    const sig = raw.slice(dot + 1);
    const expect = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
    if (sig !== expect) return null;

    const { uid, exp, purpose } = JSON.parse(payload);
    if (purpose !== 'onboard') return null;
    if (typeof exp !== 'number' || Date.now() > exp) return null;

    return { userId: Number(uid) };
  } catch {
    return null;
  }
}
