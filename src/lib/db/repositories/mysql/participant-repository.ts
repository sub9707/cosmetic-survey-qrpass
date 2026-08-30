import { and, desc, eq, gte, isNull, lt, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { DAILY_REGISTRATION_LIMIT, type NotificationStatus } from "@/lib/constants";
import { mysqlDb } from "@/lib/db/client.mysql";
import {
  answers as answersTable,
  checkIns as checkInsTable,
  dailyCounters as dailyCountersTable,
  participants as participantsTable,
} from "@/lib/db/schema.mysql";
import type { ParticipantRepository } from "@/lib/db/repositories/types";
import { decryptPii, encryptPii, hashPhoneForLookup } from "@/lib/security/pii";
import { todayDateString } from "@/lib/utils/date";
import type { AdminCheckInResult, CheckInResult } from "@/types/check-in";
import type { Participant, ParticipantInput } from "@/types/participant";

/**
 * mysql2가 던지는 유니크 제약 위반 에러인지, 그중 전화번호 중복 인덱스인지 판별.
 * drizzle이 실제 mysql2 에러를 DrizzleQueryError로 감싸서 `.cause`에 넣어주므로 그 안도 확인한다.
 */
function isDuplicatePhoneError(err: unknown): boolean {
  const check = (e: unknown): boolean => {
    const obj = e as { code?: string; sqlMessage?: string; message?: string } | undefined;
    return obj?.code === "ER_DUP_ENTRY" && (obj.sqlMessage ?? obj.message ?? "").includes("phone_lookup");
  };
  return check(err) || check((err as { cause?: unknown } | undefined)?.cause);
}

export const mysqlParticipantRepository: ParticipantRepository = {
  async createIfCapacityAvailable(
    input: ParticipantInput,
    qrTokenHash: string,
  ): Promise<
    | { status: "CREATED"; participant: Participant }
    | { status: "FULL" }
    | { status: "DUPLICATE_PHONE" }
  > {
    const date = todayDateString();
    const phoneLookupHash = hashPhoneForLookup(input.phone);

    try {
      return await mysqlDb.transaction(async (tx) => {
        // 오늘 카운터 행이 없으면 만들어 둔다 (아래 조건부 UPDATE가 걸 행을 보장하기 위함).
        await tx
          .insert(dailyCountersTable)
          .values({ eventId: input.eventId, date, count: 0 })
          .onDuplicateKeyUpdate({ set: { eventId: sql`${dailyCountersTable.eventId}` } });

        // count < LIMIT일 때만 +1 — 동시 요청이 몰려도 정원을 넘지 않는 조건부 UPDATE 하나로
        // 원자성을 확보한다 (atomicCheckIn과 동일한 패턴, draft.md §10).
        const [reserved] = await tx
          .update(dailyCountersTable)
          .set({ count: sql`${dailyCountersTable.count} + 1` })
          .where(
            and(
              eq(dailyCountersTable.eventId, input.eventId),
              eq(dailyCountersTable.date, date),
              lt(dailyCountersTable.count, DAILY_REGISTRATION_LIMIT),
            ),
          );

        if (reserved.affectedRows === 0) {
          return { status: "FULL" as const };
        }

        const id = randomUUID();
        const createdAt = new Date();

        // 이름/전화번호는 암호화해서 저장 (평문 저장 금지). 전화번호 중복은 이 insert가
        // participants_event_phone_lookup_idx 유니크 제약에 걸리는 것으로 원자적으로 막힌다
        // (동시에 두 요청이 들어와도 하나만 성공 — daily_counters와 같은 사고방식).
        await tx.insert(participantsTable).values({
          id,
          eventId: input.eventId,
          name: encryptPii(input.name),
          phone: encryptPii(input.phone),
          phoneLookupHash,
          privacyAgreed: input.privacyAgreed,
          marketingAgreed: input.marketingAgreed,
          qrTokenHash,
          notificationStatus: "PENDING",
          createdAt,
        });

        if (input.answers.length > 0) {
          await tx.insert(answersTable).values(
            input.answers.map((a) => ({
              id: randomUUID(),
              participantId: id,
              questionId: a.questionId,
              answer: a.choice,
            })),
          );
        }

        return {
          status: "CREATED" as const,
          participant: {
            id,
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
            createdAt: createdAt.toISOString(),
          },
        };
      });
    } catch (err) {
      if (isDuplicatePhoneError(err)) {
        return { status: "DUPLICATE_PHONE" as const };
      }
      throw err;
    }
  },

  async getDailyCapacity(eventId: string) {
    const date = todayDateString();
    const [row] = await mysqlDb
      .select({ count: dailyCountersTable.count })
      .from(dailyCountersTable)
      .where(and(eq(dailyCountersTable.eventId, eventId), eq(dailyCountersTable.date, date)));

    const count = row?.count ?? 0;
    return { limit: DAILY_REGISTRATION_LIMIT, count, isFull: count >= DAILY_REGISTRATION_LIMIT };
  },

  async updateNotificationStatus(participantId: string, status: NotificationStatus): Promise<void> {
    await mysqlDb
      .update(participantsTable)
      .set({ notificationStatus: status })
      .where(eq(participantsTable.id, participantId));
  },

  async updateQrImageUrl(participantId: string, qrImageUrl: string): Promise<void> {
    await mysqlDb.update(participantsTable).set({ qrImageUrl }).where(eq(participantsTable.id, participantId));
  },

  async atomicCheckIn({ qrTokenHash, eventId, staffId }): Promise<CheckInResult> {
    return mysqlDb.transaction(async (tx) => {
      const [participant] = await tx
        .select()
        .from(participantsTable)
        .where(eq(participantsTable.qrTokenHash, qrTokenHash))
        .limit(1);

      if (!participant) return { status: "INVALID_QR" };
      if (participant.eventId !== eventId) return { status: "WRONG_EVENT" };

      // draft.md §10: SELECT로 미리 확인하되, 실제 입장 확정은 이 조건부 UPDATE
      // 하나로 원자적으로 처리한다 (동시에 두 요청이 들어와도 하나만 성공).
      const [result] = await tx
        .update(participantsTable)
        .set({ checkedInAt: new Date() })
        .where(and(eq(participantsTable.id, participant.id), isNull(participantsTable.checkedInAt)));

      if (result.affectedRows === 0) {
        const [latest] = await tx
          .select()
          .from(participantsTable)
          .where(eq(participantsTable.id, participant.id))
          .limit(1);
        return {
          status: "ALREADY_CHECKED_IN",
          participantName: decryptPii(latest.name),
          checkedInAt: (latest.checkedInAt ?? new Date()).toISOString(),
        };
      }

      await tx.insert(checkInsTable).values({
        id: randomUUID(),
        participantId: participant.id,
        staffId,
      });

      return { status: "CHECKED_IN", participantName: decryptPii(participant.name) };
    });
  },

  async countCheckedInToday(eventId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [row] = await mysqlDb
      .select({ count: sql<number>`count(*)` })
      .from(participantsTable)
      .where(
        and(
          eq(participantsTable.eventId, eventId),
          sql`${participantsTable.checkedInAt} is not null`,
          gte(participantsTable.checkedInAt, startOfDay),
        ),
      );

    return Number(row?.count ?? 0);
  },

  async listByEventAndDate(eventId: string, date: string) {
    // 참가자 등록 시각은 KST 기준으로 다룬다는 전제(daily_counters와 동일) — 날짜 범위를 KST로 고정 변환.
    const start = new Date(`${date}T00:00:00+09:00`);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

    const rows = await mysqlDb
      .select()
      .from(participantsTable)
      .where(
        and(
          eq(participantsTable.eventId, eventId),
          gte(participantsTable.createdAt, start),
          lt(participantsTable.createdAt, end),
        ),
      )
      .orderBy(desc(participantsTable.createdAt));

    return rows.map((r) => ({
      id: r.id,
      name: decryptPii(r.name),
      phone: decryptPii(r.phone),
      notificationStatus: r.notificationStatus,
      checkedInAt: r.checkedInAt ? r.checkedInAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
      qrImageUrl: r.qrImageUrl,
    }));
  },

  async manualCheckIn(participantId: string, staffId: string): Promise<AdminCheckInResult> {
    return mysqlDb.transaction(async (tx) => {
      const [participant] = await tx
        .select()
        .from(participantsTable)
        .where(eq(participantsTable.id, participantId))
        .limit(1);

      if (!participant) return { status: "NOT_FOUND" };

      const [result] = await tx
        .update(participantsTable)
        .set({ checkedInAt: new Date() })
        .where(and(eq(participantsTable.id, participantId), isNull(participantsTable.checkedInAt)));

      if (result.affectedRows === 0) {
        return {
          status: "ALREADY_CHECKED_IN",
          checkedInAt: (participant.checkedInAt ?? new Date()).toISOString(),
        };
      }

      await tx.insert(checkInsTable).values({ id: randomUUID(), participantId, staffId });

      return { status: "CHECKED_IN", checkedInAt: new Date().toISOString() };
    });
  },

  async cancelCheckIn(participantId: string): Promise<void> {
    await mysqlDb
      .update(participantsTable)
      .set({ checkedInAt: null })
      .where(eq(participantsTable.id, participantId));
  },

  async remove(participantId: string): Promise<void> {
    await mysqlDb.transaction(async (tx) => {
      await tx.delete(checkInsTable).where(eq(checkInsTable.participantId, participantId));
      await tx.delete(answersTable).where(eq(answersTable.participantId, participantId));
      await tx.delete(participantsTable).where(eq(participantsTable.id, participantId));
    });
  },
};
