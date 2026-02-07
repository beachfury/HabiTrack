// apps/api/src/routes/chores/index.ts
// Chores routes - central export

import { Request, Response, NextFunction } from 'express';

// Categories
export { getCategories, createCategory, updateCategory, deleteCategory } from './categories';

// Chore Definitions
export {
  getChores,
  getChore,
  createChore,
  updateChore,
  deleteChore,
  hardDeleteChore,
  regenerateInstances,
} from './definitions';

// Chore Instances
export {
  getInstances,
  completeInstance,
  approveInstance,
  rejectInstance,
  skipInstance,
  reassignInstance,
} from './instances';

// Statistics & Leaderboard
export { getStats, getLeaderboard, adjustPoints } from './stats';

// Assignments Management (for admin to manage assigned chores)
export { getAssignments, deleteAssignment, bulkDeleteAssignments } from './assignments';

// Templates
export {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  applyTemplate,
} from './templates';

export function createFromTemplate(
  arg0: string,
  arg1: (req: Request, res: Response, next: NextFunction) => Promise<void | Response>,
  writeRateLimiter: any,
  createFromTemplate: unknown,
) {
  throw new Error('Function not implemented.');
}

export function setAssignments(
  arg0: string,
  arg1: (req: Request, res: Response, next: NextFunction) => Promise<void | Response>,
  writeRateLimiter: any,
  setAssignments: unknown,
) {
  throw new Error('Function not implemented.');
}
