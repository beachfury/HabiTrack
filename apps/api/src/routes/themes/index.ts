// apps/api/src/routes/themes/index.ts
// Themes routes - central export

export {
  listThemes,
  getTheme,
  createTheme,
  updateTheme,
  deleteTheme,
  duplicateTheme,
  toggleKidApproval,
} from './library';

export { getUserThemePreferences, updateUserThemePreferences } from './preferences';
