/** draft.md §12 API 응답 상태를 그대로 따르는 결과 타입 */
export type CheckInResult =
  | { status: "CHECKED_IN"; participantName: string }
  | { status: "ALREADY_CHECKED_IN"; participantName: string; checkedInAt: string }
  | { status: "INVALID_QR" }
  | { status: "WRONG_EVENT" };
