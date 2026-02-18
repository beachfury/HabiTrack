// apps/api/src/routes/auth/index.ts
// Auth routes - central export

// Session management
export { postLogin as postDevLogin, postLogout, getMe, checkSession } from './session';

// Credential authentication
export { postRegister, postLogin as postCredsLogin, postChangePassword } from './credentials';

// Password reset
export { postForgotPassword, postResetPassword } from './reset';

// PIN authentication
export { getPinUsers, postPinLogin, verifyPin } from './pin';

// Onboarding
export { postOnboardComplete, postSetPassword } from './onboard';
