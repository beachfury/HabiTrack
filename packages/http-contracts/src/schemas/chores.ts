import { z } from 'zod';

export const ChoreSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1),
  assignedToUserId: z.number().int().positive(),
  dueDate: z.string().datetime().optional(), // ISO
  status: z.enum(['open', 'done']).default('open'),
  paid: z.boolean().default(false)
});

export const GetChoresResponseSchema = z.object({
  items: z.array(ChoreSchema),
});
