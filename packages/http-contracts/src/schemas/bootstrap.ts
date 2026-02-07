import { z } from 'zod';
import { UserProfileSchema } from './auth.js';

export const BootstrapModeSchema = z.enum(['new', 'promote']);

export const BootstrapRequestSchema = z.object({
  mode: BootstrapModeSchema,
  username: z.string().min(1).optional(),
  userId: z.number().int().positive().optional(),
  credential: z.discriminatedUnion('type', [
    z.object({ type: z.literal('password'), secret: z.string().min(8) }),
    z.object({ type: z.literal('pin'), secret: z.string().min(4).max(12).regex(/^\d+$/, 'PIN must be digits') }),
  ]),
  kioskDisplayName: z.string().min(1).max(120).optional(),
  kioskToken: z.string().min(20).optional(), // only required on first run
}).refine((v) => v.username || v.userId, { message: 'Provide username or userId' });

export const BootstrapResponseSchema = z.object({
  bootstrapped: z.literal(true),
  admin: UserProfileSchema,
  kiosk: UserProfileSchema,
});
