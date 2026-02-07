import { z } from 'zod';

export const KioskSummaryResponseSchema = z.object({
  totalUsers: z.number().int().nonnegative(),
  admins: z.number().int().nonnegative(),
  members: z.number().int().nonnegative(),
  kids: z.number().int().nonnegative(),
  kiosks: z.number().int().nonnegative(),
  displayName: z.string().optional(),
  updatedAt: z.string(), // ISO
});
