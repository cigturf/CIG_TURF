/** Email that uses password-based admin sign-in on the login page. */
export const ADMIN_LOGIN_EMAIL = "cigturf@gmail.com";

export function isAdminLoginEmail(email: string): boolean {
  return email.trim().toLowerCase() === ADMIN_LOGIN_EMAIL;
}
