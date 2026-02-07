export interface KioskSummary {
  totalUsers: number;
  admins: number;
  members: number;
  kids: number;
  kiosks: number;
  displayName?: string;
  updatedAt: string; // ISO
}

export interface KioskSummaryDeps {
  countUsersByRole: (role: 'admin' | 'member' | 'kid' | 'kiosk') => Promise<number> | number;
  getKioskDisplayName?: () => Promise<string | undefined> | string | undefined;
  now?: () => Date;
}

/**
 * Returns a minimal kiosk dashboard summary. Extend later with domain stats.
 */
export async function getKioskSummary(deps: KioskSummaryDeps): Promise<KioskSummary> {
  const now = deps.now ? deps.now() : new Date();
  const [admins, members, kids, kiosks] = await Promise.all([
    deps.countUsersByRole('admin'),
    deps.countUsersByRole('member'),
    deps.countUsersByRole('kid'),
    deps.countUsersByRole('kiosk'),
  ]);

  const totalUsers = admins + members + kids + kiosks;
  const displayName = deps.getKioskDisplayName ? await deps.getKioskDisplayName() : undefined;

  return {
    totalUsers,
    admins,
    members,
    kids,
    kiosks,
    displayName,
    updatedAt: now.toISOString(),
  };
}
