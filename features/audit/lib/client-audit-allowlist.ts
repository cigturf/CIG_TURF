import { APP_EVENT_TYPES } from "@/features/events/constants/event-types";
import type { AppEventType } from "@/features/events/constants/event-types";

/** Events a non-admin browser session may persist via /api/audit/record. */
export const CUSTOMER_AUDIT_EVENT_TYPES = new Set<AppEventType>([
  APP_EVENT_TYPES.AUTH_LOGIN_SUCCESS,
  APP_EVENT_TYPES.AUTH_LOGOUT,
  APP_EVENT_TYPES.AUTH_LOGIN_FAILED,
  APP_EVENT_TYPES.AUTH_PASSWORD_RESET,
  APP_EVENT_TYPES.PAYMENT_COMPLETED,
  APP_EVENT_TYPES.PAYMENT_FAILED,
]);

export function isCustomerAuditEventType(type: string): type is AppEventType {
  return CUSTOMER_AUDIT_EVENT_TYPES.has(type as AppEventType);
}
