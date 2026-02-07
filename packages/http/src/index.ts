import { type RoleId, type Rule, isAllowed } from '@habitrack/perm';

export class HttpError extends Error {
  status: number;
  code: string;
  details?: Record<string, unknown>;
  constructor(status: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export type Session = { userId: number; role: RoleId } | null;

export interface Context {
  session: Session;
  isLocalRequest: boolean;
  isBootstrapped: boolean;
  getRoleRules(role: RoleId): Rule[]; // fetch rules for the given role (from DB or cache)
}

export function sessionRequired(ctx: Context): asserts ctx is Context & { session: NonNullable<Session> } {
  if (!ctx.session) {
    throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');
  }
}

export function requirePerm(action: string) {
  return (ctx: Context): void => {
    if (!ctx.session) {
      throw new HttpError(401, 'AUTH_REQUIRED', 'Authentication required');
    }
    const rules = ctx.getRoleRules(ctx.session.role);
    const ok = isAllowed({ action, rules, isLocalRequest: ctx.isLocalRequest });
    if (!ok) {
      throw new HttpError(403, 'PERMISSION_DENIED', 'You do not have permission for this action', { action });
    }
  };
}

export function requirePermUnlessBootstrapped(action: string) {
  return (ctx: Context): void => {
    if (!ctx.isBootstrapped) {
      return; // allow during first-run
    }
    return requirePerm(action)(ctx);
  };
}
