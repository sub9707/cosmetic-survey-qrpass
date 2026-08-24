import type { NotificationStatus } from "@/lib/constants";
import type { CheckInResult } from "@/types/check-in";
import type { Participant, ParticipantInput } from "@/types/participant";
import type { Staff } from "@/types/staff";
import type { EventSummary } from "@/types/event";

/**
 * 참가자 저장소 인터페이스. 홈랩(MySQL)과 이후 Workers(Postgres/Supabase)가
 * 같은 인터페이스를 구현하고, 호출부(API 라우트)는 구현체를 몰라도 되게 한다.
 * (draft-modular-coral.md §3 Repository 패턴)
 */
export interface ParticipantRepository {
  create(input: ParticipantInput, qrTokenHash: string): Promise<Participant>;
  updateNotificationStatus(participantId: string, status: NotificationStatus): Promise<void>;
  /** 원자적 입장 처리 (draft.md §10 — 동시 스캔에도 한 번만 성공해야 한다) */
  atomicCheckIn(input: { qrTokenHash: string; eventId: string; staffId: string }): Promise<CheckInResult>;
  countCheckedInToday(eventId: string): Promise<number>;
}

export interface StaffRepository {
  findByUsername(username: string): Promise<Staff | null>;
  /** 이 직원이 담당하는 행사 목록 (event_staff 연결) */
  listAssignedEvents(staffId: string): Promise<EventSummary[]>;
}
