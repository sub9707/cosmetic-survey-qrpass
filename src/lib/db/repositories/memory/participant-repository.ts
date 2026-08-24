import { randomUUID } from "node:crypto";
import type { NotificationStatus } from "@/lib/constants";
import type { ParticipantRepository } from "@/lib/db/repositories/types";
import type { CheckInResult } from "@/types/check-in";
import type { Participant, ParticipantInput } from "@/types/participant";

/**
 * 홈랩 MySQL 연결 정보가 준비되기 전까지 쓰는 임시 in-memory 구현체.
 * ParticipantRepository 인터페이스만 지키면 되므로, 실제 MySQL 구현체로
 * 교체할 때 API 라우트 쪽 코드는 손댈 필요가 없다.
 * (서버 재시작 시 데이터가 초기화됨 — 데모 전용)
 */
class InMemoryParticipantRepository implements ParticipantRepository {
  private store = new Map<string, Participant>();

  async create(input: ParticipantInput, qrTokenHash: string): Promise<Participant> {
    const participant: Participant = {
      id: randomUUID(),
      eventId: input.eventId,
      name: input.name,
      phone: input.phone,
      privacyAgreed: input.privacyAgreed,
      marketingAgreed: input.marketingAgreed,
      answers: input.answers,
      qrTokenHash,
      notificationStatus: "PENDING",
      checkedInAt: null,
      createdAt: new Date().toISOString(),
    };
    this.store.set(participant.id, participant);
    return participant;
  }

  async updateNotificationStatus(participantId: string, status: NotificationStatus): Promise<void> {
    const participant = this.store.get(participantId);
    if (participant) participant.notificationStatus = status;
  }

  async atomicCheckIn({
    qrTokenHash,
    eventId,
  }: {
    qrTokenHash: string;
    eventId: string;
    staffId: string;
  }): Promise<CheckInResult> {
    const participant = [...this.store.values()].find((p) => p.qrTokenHash === qrTokenHash);
    if (!participant) return { status: "INVALID_QR" };
    if (participant.eventId !== eventId) return { status: "WRONG_EVENT" };
    // 이 함수 안에서 await 없이 확인+기록하므로(JS 싱글 스레드) 동시 요청에도 원자적이다.
    if (participant.checkedInAt) {
      return {
        status: "ALREADY_CHECKED_IN",
        participantName: participant.name,
        checkedInAt: participant.checkedInAt,
      };
    }
    participant.checkedInAt = new Date().toISOString();
    return { status: "CHECKED_IN", participantName: participant.name };
  }

  async countCheckedInToday(eventId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return [...this.store.values()].filter(
      (p) => p.eventId === eventId && p.checkedInAt && new Date(p.checkedInAt) >= startOfDay,
    ).length;
  }
}

// 모듈 싱글턴: Next.js dev 서버의 hot reload에도 같은 인스턴스를 재사용한다.
declare global {
  var __participantRepository: InMemoryParticipantRepository | undefined;
}

export const participantRepository: ParticipantRepository =
  globalThis.__participantRepository ?? new InMemoryParticipantRepository();

if (process.env.NODE_ENV !== "production") {
  globalThis.__participantRepository = participantRepository as InMemoryParticipantRepository;
}
