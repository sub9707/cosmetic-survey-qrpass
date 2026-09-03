/** 설문 문항당 고정 선택지 개수 (draft.md §10) */
export const SURVEY_CHOICE_COUNT = 4;

export const CHOICE_LABELS = ["A", "B", "C", "D"] as const;
export type ChoiceLabel = (typeof CHOICE_LABELS)[number];

export const USER_ROLES = ["CUSTOMER", "STAFF", "ADMIN"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** staff 테이블에 실제로 로그인 계정을 가질 수 있는 역할 (CUSTOMER 제외) */
export const STAFF_ROLES = ["STAFF", "ADMIN"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const EVENT_STATUSES = ["DRAFT", "ACTIVE", "CLOSED", "ARCHIVED"] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

/** draft.md §12 API 응답 상태 */
export const CHECK_IN_STATUSES = [
  "CHECKED_IN",
  "ALREADY_CHECKED_IN",
  "INVALID_QR",
  "WRONG_EVENT",
  "EXPIRED_QR",
  "UNAUTHORIZED",
  "SERVER_ERROR",
] as const;
export type CheckInStatus = (typeof CHECK_IN_STATUSES)[number];

/** draft.md §29 알림톡 발송 상태 */
export const NOTIFICATION_STATUSES = ["PENDING", "SENT", "FAILED"] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

export const STAFF_SESSION_COOKIE = "staff_session";
export const STAFF_SESSION_TTL_SECONDS = 60 * 60 * 12; // 12시간 (근무 교대 기준)

/** 하루 선착순 참가 정원 */
export const DAILY_REGISTRATION_LIMIT = 100;

/** 데모 단계 전용 고정 계정 (seed 스크립트, memory 어댑터, 로그인 화면이 공유) */
export const DEMO_STAFF_USERNAME = "staff1";
export const DEMO_STAFF_PASSWORD = "staff1234";
export const DEMO_ADMIN_USERNAME = "admin1";
export const DEMO_ADMIN_PASSWORD = "admin12345";

export const ROUTES = {
  event: (slug: string) => `/event/${slug}`,
  eventSurvey: (slug: string) => `/event/${slug}/survey`,
  eventComplete: (slug: string) => `/event/${slug}/complete`,
  eventPass: (slug: string, participantId: string) => `/event/${slug}/pass/${participantId}`,
  staffLogin: "/staff/login",
  staffEvent: (eventId: string) => `/staff/${eventId}`,
  staffEventScan: (eventId: string) => `/staff/${eventId}/scan`,
  adminLogin: "/admin/login",
  admin: "/admin",
  adminEvent: (eventId: string) => `/admin/${eventId}`,
  adminEventDaily: (eventId: string) => `/admin/${eventId}/daily`,
  adminEventParticipants: (eventId: string) => `/admin/${eventId}/participants`,
  adminEventCheckIns: (eventId: string) => `/admin/${eventId}/check-ins`,
  adminEventScan: (eventId: string) => `/admin/${eventId}/scan`,
} as const;
