/** draft.md §12 API 응답 상태를 그대로 따르는 결과 타입 (QR 스캔 입장) */
export type CheckInResult =
  | { status: "CHECKED_IN"; participantName: string }
  | { status: "ALREADY_CHECKED_IN"; participantName: string; checkedInAt: string }
  | { status: "INVALID_QR" }
  | { status: "WRONG_EVENT" };

/** 관리자 화면의 수동 입장 확인/취소 결과 (QR이 아닌 참가자 id 기준) */
export type AdminCheckInResult =
  | { status: "CHECKED_IN"; checkedInAt: string }
  | { status: "ALREADY_CHECKED_IN"; checkedInAt: string }
  | { status: "NOT_FOUND" };
