// apps/api/src/routes/family/index.ts
// Family routes - central export

export {
  getMembers,
  getMember,
  createMember,
  updateMember,
  deleteMember,
  reactivateMember,
  hardDeleteMember,
  forcePasswordReset,
} from './members';

export {
  setPassword,
  setPin,
  removePin,
} from './credentials';
