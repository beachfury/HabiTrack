import { z } from 'zod';

export const EffectSchema = z.enum(['allow', 'deny']);

export const RuleSchema = z.object({
  actionPattern: z.string().min(1),
  effect: EffectSchema,
  localOnly: z.boolean().optional().default(false),
});

export const RoleIdSchema = z.enum(['admin','member','kid','kiosk']);

export const RolesRulesSchema = z.record(RoleIdSchema, z.array(RuleSchema));

export const GetPermissionsResponseSchema = z.object({
  roles: RolesRulesSchema,
});

export const PutPermissionsRequestSchema = z.object({
  roles: z.record(z.string(), z.array(RuleSchema)), // allow future custom roles if needed
});
