export {
  checkIsAdminAction,
  completeProfileAction,
  getSessionUserAction,
  signOutAction,
} from "@/features/auth/actions";
export { AuthPage, CustomerDashboard } from "@/features/auth/components";
export { signOutClient, useAuthSession } from "@/features/auth/hooks";
export { isProfileComplete } from "@/features/auth/utils/profile";
export {
  AUTH_ROUTES,
  type AuthUser,
  type LoginMode,
  type ProfileCompletionInput,
} from "@/features/auth/types";
export { buildLoginUrl, buildAuthContinueUrl, resolvePostAuthRedirect } from "@/features/auth/utils/redirect";
