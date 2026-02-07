# HabiTrack — Phase 10 (Steps 7–9)

This bundle adds:
- `@habitrack/perm`: permission engine (wildcards, deny-wins, localOnly)
- `@habitrack/http`: framework-agnostic guards (sessionRequired, requirePerm, requirePermUnlessBootstrapped)
- `@habitrack/kiosk`: kiosk summary scaffold
- `@habitrack/http-contracts`: kiosk summary + chores schemas and exports

## Merge steps
1) Unzip at your monorepo root, merging into `packages/`.
2) Ensure `pnpm-workspace.yaml` includes `packages/*`.
3) From repo root:
   ```sh
   pnpm install
   pnpm -r --filter @habitrack/* build
   ```

## How to use the guards
Create an adapter in your API that provides a `Context`:
```ts
import { sessionRequired, requirePerm, requirePermUnlessBootstrapped } from '@habitrack/http';

const ctx = {
  session: { userId: 1, role: 'member' },       // or null
  isLocalRequest: true,                          // compute via proxy + CIDR logic
  isBootstrapped: true,                          // read from settings
  getRoleRules: (role) => rulesFromDb(role),     // load rules from DB/cache
};

// Example route guard usage:
sessionRequired(ctx);                            // throws 401 if not logged-in
requirePerm('chores.read')(ctx);                 // throws 403 if role not allowed
requirePermUnlessBootstrapped('settings.read')(ctx); // bypass if not bootstrapped yet
```

## Kiosk summary
```ts
import { getKioskSummary } from '@habitrack/kiosk';

const summary = await getKioskSummary({
  countUsersByRole: async (role) => db.countUsers(role),
  getKioskDisplayName: async () => settings.kioskDisplayName,
});
// Validate/shape with @habitrack/http-contracts Kiosk.KioskSummaryResponseSchema if desired
```

Happy building!
