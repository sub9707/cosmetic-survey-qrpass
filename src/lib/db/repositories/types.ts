import type { NotificationStatus } from "@/lib/constants";
import type { AdminDailyStat, AdminEventStats } from "@/types/admin";
import type { AdminCheckInResult, CheckInResult } from "@/types/check-in";
import type { AdminParticipantSummary, Participant, ParticipantInput } from "@/types/participant";
import type { Staff } from "@/types/staff";
import type { DailyCapacity, EventSummary } from "@/types/event";

/** 관리자 참여자 정보 수정 결과 */
export type AdminParticipantUpdateResult =
  | { status: "UPDATED" }
  | { status: "NOT_FOUND" }
  | { status: "DUPLICATE_PHONE" };

/** 설문 문항 하나에 대한 선택지별 응답 수 (문항 텍스트는 호출부에서 붙인다) */
export interface AnswerCount {
  questionId: string;
  choice: string;
  count: number;
}

/**
 * 참가자 저장소 인터페이스. 홈랩(MySQL)과 이후 Workers(Postgres/Supabase)가
 * 같은 인터페이스를 구현하고, 호출부(API 라우트)는 구현체를 몰라도 되게 한다.
 * (draft-modular-coral.md §3 Repository 패턴)
 */
export interface ParticipantRepository {
  /**
   * 하루 정원(daily_counters)이 남아있을 때만 정원을 원자적으로 확보한 뒤 참가자를 생성한다.
   * 정원 초과 시 FULL, 같은 행사에 이미 같은 전화번호로 등록된 참가자가 있으면
   * DUPLICATE_PHONE을 반환하고 둘 다 참가자를 만들지 않는다 (정원도 소모하지 않음).
   */
  createIfCapacityAvailable(
    input: ParticipantInput,
    qrToken: string,
    qrTokenHash: string,
  ): Promise<
    | { status: "CREATED"; participant: Participant }
    | { status: "FULL" }
    | { status: "DUPLICATE_PHONE" }
  >;
  /** 오늘 등록 현황 (랜딩 페이지 CTA 활성/비활성 판단용) */
  getDailyCapacity(eventId: string): Promise<DailyCapacity>;
  updateNotificationStatus(participantId: string, status: NotificationStatus): Promise<void>;
  updateQrImageUrl(participantId: string, qrImageUrl: string): Promise<void>;
  /** 원자적 입장 처리 (draft.md §10 — 동시 스캔에도 한 번만 성공해야 한다) */
  atomicCheckIn(input: { qrTokenHash: string; eventId: string; staffId: string }): Promise<CheckInResult>;
  countCheckedInToday(eventId: string): Promise<number>;
  /** 참가자 본인 화면(로그인 없음)의 입장 여부 + QR 폴링용. 없으면 null. */
  getParticipantStatus(participantId: string): Promise<{
    checkedIn: boolean;
    qrImageUrl: string | null;
    qrToken: string | null;
  } | null>;

  // ---- 관리자 전용 (입장 취소/수동 확인/제거/일자별 조회) ----
  listByEventAndDate(eventId: string, date: string): Promise<AdminParticipantSummary[]>;
  manualCheckIn(participantId: string, staffId: string): Promise<AdminCheckInResult>;
  cancelCheckIn(participantId: string): Promise<void>;
  remove(participantId: string): Promise<void>;
  /** 이름/전화번호 수정. 같은 행사에 같은 번호가 이미 있으면 DUPLICATE_PHONE. */
  updateParticipant(
    participantId: string,
    input: { name: string; phone: string },
  ): Promise<AdminParticipantUpdateResult>;
  /** 입장 시각을 특정 시점으로 조정 (관리자 수기 보정). */
  updateCheckInTime(
    participantId: string,
    staffId: string,
    checkedInAt: Date,
  ): Promise<{ status: "UPDATED" | "NOT_FOUND" }>;

  // ---- 관리자 전용 (통계) ----
  getEventStats(eventId: string): Promise<AdminEventStats>;
  /** 문항 id + 선택지별 응답 수 (문항 메타는 호출부에서 결합) */
  getAnswerCounts(eventId: string): Promise<AnswerCount[]>;
  /** KST 등록일 기준 일자별 참여/입장 인원 (최신일 먼저) */
  getDailyStats(eventId: string): Promise<AdminDailyStat[]>;
}

export interface StaffRepository {
  findByUsername(username: string): Promise<Staff | null>;
  /** 이 직원이 담당하는 행사 목록 (event_staff 연결) */
  listAssignedEvents(staffId: string): Promise<EventSummary[]>;
}
