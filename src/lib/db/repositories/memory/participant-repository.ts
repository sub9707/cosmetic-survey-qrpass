import { randomUUID } from "node:crypto";
import { DAILY_REGISTRATION_LIMIT, type NotificationStatus } from "@/lib/constants";
import type { ParticipantRepository } from "@/lib/db/repositories/types";
import { todayDateString } from "@/lib/utils/date";
import type { AdminCheckInResult, CheckInResult } from "@/types/check-in";
import type { AdminParticipantSummary, Participant, ParticipantInput } from "@/types/participant";

/**
 * 홈랩 MySQL 연결 정보가 준비되기 전까지 쓰는 임시 in-memory 구현체.
 * ParticipantRepository 인터페이스만 지키면 되므로, 실제 MySQL 구현체로
 * 교체할 때 API 라우트 쪽 코드는 손댈 필요가 없다.
 * (서버 재시작 시 데이터가 초기화됨 — 데모 전용)
 */
class InMemoryParticipantRepository implements ParticipantRepository {
  private store = new Map<string, Participant>();
  /** key: `${eventId}:${date}` */
  private dailyCounts = new Map<string, number>();

  async createIfCapacityAvailable(input: ParticipantInput, qrTokenHash: string) {
    // 이 함수 안에서 await 없이 확인+증가하므로(JS 싱글 스레드) 동시 요청에도 원자적이다.
    const alreadyRegistered = [...this.store.values()].some(
      (p) => p.eventId === input.eventId && p.phone === input.phone,
    );
    if (alreadyRegistered) {
      return { status: "DUPLICATE_PHONE" as const };
    }

    const key = `${input.eventId}:${todayDateString()}`;
    const current = this.dailyCounts.get(key) ?? 0;
    if (current >= DAILY_REGISTRATION_LIMIT) {
      return { status: "FULL" as const };
    }
    this.dailyCounts.set(key, current + 1);

    const participant: Participant = {
      id: randomUUID(),
      eventId: input.eventId,
      name: input.name,
      phone: input.phone,
      privacyAgreed: input.privacyAgreed,
      marketingAgreed: input.marketingAgreed,
      answers: input.answers,
      qrTokenHash,
      qrImageUrl: null,
      notificationStatus: "PENDING",
      checkedInAt: null,
      createdAt: new Date().toISOString(),
    };
    this.store.set(participant.id, participant);
    return { status: "CREATED" as const, participant };
  }

  async getDailyCapacity(eventId: string) {
    const key = `${eventId}:${todayDateString()}`;
    const count = this.dailyCounts.get(key) ?? 0;
    return { limit: DAILY_REGISTRATION_LIMIT, count, isFull: count >= DAILY_REGISTRATION_LIMIT };
  }

  async updateNotificationStatus(participantId: string, status: NotificationStatus): Promise<void> {
    const participant = this.store.get(participantId);
    if (participant) participant.notificationStatus = status;
  }

  async updateQrImageUrl(participantId: string, qrImageUrl: string): Promise<void> {
    const participant = this.store.get(participantId);
    if (participant) participant.qrImageUrl = qrImageUrl;
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

  async listByEventAndDate(eventId: string, date: string): Promise<AdminParticipantSummary[]> {
    return [...this.store.values()]
      .filter((p) => p.eventId === eventId && p.createdAt.slice(0, 10) === date)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map((p) => ({
        id: p.id,
        name: p.name,
        phone: p.phone,
        notificationStatus: p.notificationStatus,
        checkedInAt: p.checkedInAt,
        createdAt: p.createdAt,
        qrImageUrl: p.qrImageUrl,
      }));
  }

  async manualCheckIn(participantId: string): Promise<AdminCheckInResult> {
    const participant = this.store.get(participantId);
    if (!participant) return { status: "NOT_FOUND" };
    if (participant.checkedInAt) {
      return { status: "ALREADY_CHECKED_IN", checkedInAt: participant.checkedInAt };
    }
    participant.checkedInAt = new Date().toISOString();
    return { status: "CHECKED_IN", checkedInAt: participant.checkedInAt };
  }

  async cancelCheckIn(participantId: string): Promise<void> {
    const participant = this.store.get(participantId);
    if (participant) participant.checkedInAt = null;
  }

  async remove(participantId: string): Promise<void> {
    this.store.delete(participantId);
  }
}

// 모듈 싱글턴: dev 서버의 hot reload(tsx watch)에도 같은 인스턴스를 재사용한다.
declare global {
  var __participantRepository: InMemoryParticipantRepository | undefined;
}

export const participantRepository: ParticipantRepository =
  globalThis.__participantRepository ?? new InMemoryParticipantRepository();

if (process.env.NODE_ENV !== "production") {
  globalThis.__participantRepository = participantRepository as InMemoryParticipantRepository;
}
