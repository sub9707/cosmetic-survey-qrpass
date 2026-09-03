import { randomUUID } from "node:crypto";
import { DAILY_REGISTRATION_LIMIT, type NotificationStatus } from "@/lib/constants";
import type {
  AdminParticipantUpdateResult,
  AnswerCount,
  ParticipantRepository,
} from "@/lib/db/repositories/types";
import { normalizePhone } from "@/lib/utils/phone";
import { todayDateString } from "@/lib/utils/date";
import type { AdminDailyStat, AdminEventStats } from "@/types/admin";
import type { AdminCheckInResult, CheckInResult } from "@/types/check-in";
import type { AdminParticipantSummary, Participant, ParticipantInput } from "@/types/participant";

/** ISO 문자열을 KST 기준 YYYY-MM-DD 로 변환 */
function kstDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

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

  async createIfCapacityAvailable(input: ParticipantInput, qrToken: string, qrTokenHash: string) {
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
      qrToken,
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
        participantId: participant.id,
        participantName: participant.name,
        checkedInAt: participant.checkedInAt,
      };
    }
    participant.checkedInAt = new Date().toISOString();
    return { status: "CHECKED_IN", participantId: participant.id, participantName: participant.name };
  }

  async getParticipantStatus(participantId: string): Promise<{
    checkedIn: boolean;
    qrImageUrl: string | null;
    qrToken: string | null;
  } | null> {
    const participant = this.store.get(participantId);
    if (!participant) return null;
    return {
      checkedIn: participant.checkedInAt !== null,
      qrImageUrl: participant.qrImageUrl,
      qrToken: participant.qrToken,
    };
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

  async listCheckedInByDate(eventId: string, date: string): Promise<AdminParticipantSummary[]> {
    return [...this.store.values()]
      .filter((p) => p.eventId === eventId && p.checkedInAt && kstDate(p.checkedInAt) === date)
      .sort((a, b) => ((a.checkedInAt ?? "") < (b.checkedInAt ?? "") ? 1 : -1))
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

  async updateParticipant(
    participantId: string,
    input: { name: string; phone: string },
  ): Promise<AdminParticipantUpdateResult> {
    const participant = this.store.get(participantId);
    if (!participant) return { status: "NOT_FOUND" };

    const normalizedPhone = normalizePhone(input.phone);
    const dup = [...this.store.values()].some(
      (p) =>
        p.id !== participantId &&
        p.eventId === participant.eventId &&
        normalizePhone(p.phone) === normalizedPhone,
    );
    if (dup) return { status: "DUPLICATE_PHONE" };

    participant.name = input.name;
    participant.phone = normalizedPhone;
    return { status: "UPDATED" };
  }

  async updateCheckInTime(
    participantId: string,
    _staffId: string,
    checkedInAt: Date,
  ): Promise<{ status: "UPDATED" | "NOT_FOUND" }> {
    const participant = this.store.get(participantId);
    if (!participant) return { status: "NOT_FOUND" };
    participant.checkedInAt = checkedInAt.toISOString();
    return { status: "UPDATED" };
  }

  async getEventStats(eventId: string): Promise<AdminEventStats> {
    const rows = [...this.store.values()].filter((p) => p.eventId === eventId);
    const today = todayDateString();
    const todayRows = rows.filter((p) => kstDate(p.createdAt) === today);
    const notification: AdminEventStats["notification"] = { PENDING: 0, SENT: 0, FAILED: 0 };
    for (const p of rows) notification[p.notificationStatus] += 1;

    return {
      totalParticipants: rows.length,
      totalCheckedIn: rows.filter((p) => p.checkedInAt).length,
      todayParticipants: todayRows.length,
      todayCheckedIn: todayRows.filter((p) => p.checkedInAt).length,
      marketingAgreed: rows.filter((p) => p.marketingAgreed).length,
      notification,
    };
  }

  async getAnswerCounts(eventId: string): Promise<AnswerCount[]> {
    const tally = new Map<string, number>();
    for (const p of this.store.values()) {
      if (p.eventId !== eventId) continue;
      for (const a of p.answers) {
        const key = `${a.questionId}|${a.choice}`;
        tally.set(key, (tally.get(key) ?? 0) + 1);
      }
    }
    return [...tally.entries()].map(([key, count]) => {
      const [questionId, choice] = key.split("|");
      return { questionId, choice, count };
    });
  }

  async getDailyStats(eventId: string): Promise<AdminDailyStat[]> {
    const byDate = new Map<string, { registered: number; checkedIn: number }>();
    for (const p of this.store.values()) {
      if (p.eventId !== eventId) continue;
      const date = kstDate(p.createdAt);
      const entry = byDate.get(date) ?? { registered: 0, checkedIn: 0 };
      entry.registered += 1;
      if (p.checkedInAt) entry.checkedIn += 1;
      byDate.set(date, entry);
    }
    return [...byDate.entries()]
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }

  async remove(participantId: string): Promise<void> {
    // 삭제 시 그 참가자가 소모한 그 날(KST)의 정원을 되돌린다 (mysql 구현과 동일한 규칙).
    const participant = this.store.get(participantId);
    if (participant) {
      const key = `${participant.eventId}:${kstDate(participant.createdAt)}`;
      const current = this.dailyCounts.get(key) ?? 0;
      if (current > 0) this.dailyCounts.set(key, current - 1);
    }
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
