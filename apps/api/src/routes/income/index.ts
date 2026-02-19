// Income routes - central export
// Admin-only household income tracking

export {
  getIncomeDefinitions,
  getIncomeDefinition,
  createIncomeDefinition,
  updateIncomeDefinition,
  deleteIncomeDefinition,
} from './definitions';

export {
  getIncomeEntries,
  createIncomeEntry,
  updateIncomeEntry,
  deleteIncomeEntry,
  getIncomeSummary,
} from './entries';
