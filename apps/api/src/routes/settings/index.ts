// apps/api/src/routes/settings/index.ts
// Settings routes - central export

export {
  getUserSettings,
  updateUserSettings,
  changePassword,
  updateAvatar,
  removeAvatar,
} from './user';

export {
  getHouseholdSettings,
  updateHouseholdSettings,
  updateHouseholdLogo,
  removeHouseholdLogo,
} from './household';

export { getBranding } from './branding';
