// apps/api/src/routes/paid-chores/index.ts
// Re-exports from split modules

// CRUD operations
export {
  listPaidChores,
  getPaidChore,
  createPaidChore,
  updatePaidChore,
  deletePaidChore,
} from './crud';

// Workflow operations
export {
  claimPaidChore,
  completePaidChore,
  verifyPaidChore,
  rejectPaidChore,
} from './workflow';

// Earnings and leaderboard
export {
  getEarnings,
  getEarningsLeaderboard,
} from './earnings';
