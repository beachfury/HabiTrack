import { z } from 'zod';

export const CredentialSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('password'), secret: z.string().min(8) }),
  z.object({ type: z.literal('pin'), secret: z.string().min(4).max(12).regex(/^\d+$/, 'PIN must be digits') }),
]);

export const LoginRequestSchema = z.object({
  username: z.string().min(1),
  credential: CredentialSchema,
});

export const UserProfileSchema = z.object({
  id: z.number().int().positive(),
  displayName: z.string(),
  role: z.enum(['admin', 'member', 'kid', 'kiosk']),
});

export const LoginResponseSchema = z.object({
  user: UserProfileSchema,
});

export const MeResponseSchema = z.object({
  user: UserProfileSchema,
  session: z.object({
    createdAt: z.string(), // ISO
    expiresAt: z.string(), // ISO
  }),
});
