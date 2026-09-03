import { and, desc, eq, gt, gte, isNull, lt, ne, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { DAILY_REGISTRATION_LIMIT, type NotificationStatus } from "@/lib/constants";
import { mysqlDb } from "@/lib/db/client.mysql";
import {
  answers as answersTable,
  checkIns as checkInsTable,
  dailyCounters as dailyCountersTable,
  participants as participantsTable,
} from "@/lib/db/schema.mysql";
import type {
  AdminParticipantUpdateResult,
  AnswerCount,
  ParticipantRepository,
} from "@/lib/db/repositories/types";
import { decryptPii, encryptPii, hashPhoneForLookup } from "@/lib/security/pii";
import { normalizePhone } from "@/lib/utils/phone";
import { todayDateString } from "@/lib/utils/date";
import type { AdminDailyStat, AdminEventStats } from "@/types/admin";
import type { AdminCheckInResult, CheckInResult } from "@/types/check-in";
import type { Participant, ParticipantInput } from "@/types/participant";

/** created_at(UTC 저장) 을 KST 날짜 문자열로 만드는 SQL 조각 — CONVERT_TZ 미설정 환경 대비 +9h 고정. */
const KST_DATE = sql<string>`DATE_FORMAT(${participantsTable.createdAt} + INTERVAL 9 HOUR, '%Y-%m-%d')`;

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
    qrToken: string,
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
          qrToken,
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
            qrToken,
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
          participantId: participant.id,
          participantName: decryptPii(latest.name),
          checkedInAt: (latest.checkedInAt ?? new Date()).toISOString(),
        };
      }

      await tx.insert(checkInsTable).values({
        id: randomUUID(),
        participantId: participant.id,
        staffId,
      });

      return {
        status: "CHECKED_IN",
        participantId: participant.id,
        participantName: decryptPii(participant.name),
      };
    });
  },

  async getParticipantStatus(participantId: string): Promise<{
    checkedIn: boolean;
    qrImageUrl: string | null;
    qrToken: string | null;
  } | null> {
    const [row] = await mysqlDb
      .select({
        checkedInAt: participantsTable.checkedInAt,
        qrImageUrl: participantsTable.qrImageUrl,
        qrToken: participantsTable.qrToken,
      })
      .from(participantsTable)
      .where(eq(participantsTable.id, participantId))
      .limit(1);
    if (!row) return null;
    return {
      checkedIn: row.checkedInAt !== null,
      qrImageUrl: row.qrImageUrl,
      qrToken: row.qrToken,
    };
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
    await mysqlDb.transaction(async (tx) => {
      await tx
        .update(participantsTable)
        .set({ checkedInAt: null })
        .where(eq(participantsTable.id, participantId));
      // 입장 로그(check_ins)도 함께 지워, 입장 관리 화면과 통계가 어긋나지 않게 한다.
      await tx.delete(checkInsTable).where(eq(checkInsTable.participantId, participantId));
    });
  },

  async updateParticipant(
    participantId: string,
    input: { name: string; phone: string },
  ): Promise<AdminParticipantUpdateResult> {
    const normalizedPhone = normalizePhone(input.phone);
    const phoneLookupHash = hashPhoneForLookup(normalizedPhone);

    return mysqlDb.transaction(async (tx) => {
      const [current] = await tx
        .select({ eventId: participantsTable.eventId })
        .from(participantsTable)
        .where(eq(participantsTable.id, participantId))
        .limit(1);
      if (!current) return { status: "NOT_FOUND" as const };

      const [dup] = await tx
        .select({ id: participantsTable.id })
        .from(participantsTable)
        .where(
          and(
            eq(participantsTable.eventId, current.eventId),
            eq(participantsTable.phoneLookupHash, phoneLookupHash),
            ne(participantsTable.id, participantId),
          ),
        )
        .limit(1);
      if (dup) return { status: "DUPLICATE_PHONE" as const };

      await tx
        .update(participantsTable)
        .set({
          name: encryptPii(input.name),
          phone: encryptPii(normalizedPhone),
          phoneLookupHash,
        })
        .where(eq(participantsTable.id, participantId));

      return { status: "UPDATED" as const };
    });
  },

  async updateCheckInTime(
    participantId: string,
    staffId: string,
    checkedInAt: Date,
  ): Promise<{ status: "UPDATED" | "NOT_FOUND" }> {
    return mysqlDb.transaction(async (tx) => {
      const [participant] = await tx
        .select({ id: participantsTable.id })
        .from(participantsTable)
        .where(eq(participantsTable.id, participantId))
        .limit(1);
      if (!participant) return { status: "NOT_FOUND" as const };

      await tx
        .update(participantsTable)
        .set({ checkedInAt })
        .where(eq(participantsTable.id, participantId));

      // 로그를 새 시각 한 건으로 정리한다 (수기 보정이므로 이력보다 정합성을 우선).
      await tx.delete(checkInsTable).where(eq(checkInsTable.participantId, participantId));
      await tx.insert(checkInsTable).values({ id: randomUUID(), participantId, staffId, checkedInAt });

      return { status: "UPDATED" as const };
    });
  },

  async getEventStats(eventId: string): Promise<AdminEventStats> {
    const today = todayDateString();
    const checkedInExpr = sql<number>`SUM(CASE WHEN ${participantsTable.checkedInAt} IS NOT NULL THEN 1 ELSE 0 END)`;

    const [totals] = await mysqlDb
      .select({
        total: sql<number>`COUNT(*)`,
        checkedIn: checkedInExpr,
        marketing: sql<number>`SUM(CASE WHEN ${participantsTable.marketingAgreed} = 1 THEN 1 ELSE 0 END)`,
        pending: sql<number>`SUM(CASE WHEN ${participantsTable.notificationStatus} = 'PENDING' THEN 1 ELSE 0 END)`,
        sent: sql<number>`SUM(CASE WHEN ${participantsTable.notificationStatus} = 'SENT' THEN 1 ELSE 0 END)`,
        failed: sql<number>`SUM(CASE WHEN ${participantsTable.notificationStatus} = 'FAILED' THEN 1 ELSE 0 END)`,
      })
      .from(participantsTable)
      .where(eq(participantsTable.eventId, eventId));

    const [todayRow] = await mysqlDb
      .select({ total: sql<number>`COUNT(*)`, checkedIn: checkedInExpr })
      .from(participantsTable)
      .where(and(eq(participantsTable.eventId, eventId), eq(KST_DATE, today)));

    return {
      totalParticipants: Number(totals?.total ?? 0),
      totalCheckedIn: Number(totals?.checkedIn ?? 0),
      todayParticipants: Number(todayRow?.total ?? 0),
      todayCheckedIn: Number(todayRow?.checkedIn ?? 0),
      marketingAgreed: Number(totals?.marketing ?? 0),
      notification: {
        PENDING: Number(totals?.pending ?? 0),
        SENT: Number(totals?.sent ?? 0),
        FAILED: Number(totals?.failed ?? 0),
      },
    };
  },

  async getAnswerCounts(eventId: string): Promise<AnswerCount[]> {
    const rows = await mysqlDb
      .select({
        questionId: answersTable.questionId,
        choice: answersTable.answer,
        count: sql<number>`COUNT(*)`,
      })
      .from(answersTable)
      .innerJoin(participantsTable, eq(answersTable.participantId, participantsTable.id))
      .where(eq(participantsTable.eventId, eventId))
      .groupBy(answersTable.questionId, answersTable.answer);

    return rows.map((r) => ({ questionId: r.questionId, choice: r.choice, count: Number(r.count) }));
  },

  async getDailyStats(eventId: string): Promise<AdminDailyStat[]> {
    const rows = await mysqlDb
      .select({
        date: KST_DATE,
        registered: sql<number>`COUNT(*)`,
        checkedIn: sql<number>`SUM(CASE WHEN ${participantsTable.checkedInAt} IS NOT NULL THEN 1 ELSE 0 END)`,
      })
      .from(participantsTable)
      .where(eq(participantsTable.eventId, eventId))
      .groupBy(KST_DATE)
      .orderBy(desc(KST_DATE));

    return rows.map((r) => ({
      date: String(r.date),
      registered: Number(r.registered),
      checkedIn: Number(r.checkedIn),
    }));
  },

  async remove(participantId: string): Promise<void> {
    await mysqlDb.transaction(async (tx) => {
      // 삭제 전에 이 참가자가 어느 날(KST) 정원을 소모했는지 확인해, 삭제와 같은 트랜잭션에서
      // daily_counters.count를 되돌린다 (안 되돌리면 실제 100명이 안 찼는데도 마감됨).
      const [row] = await tx
        .select({ eventId: participantsTable.eventId, date: KST_DATE })
        .from(participantsTable)
        .where(eq(participantsTable.id, participantId))
        .limit(1);

      await tx.delete(checkInsTable).where(eq(checkInsTable.participantId, participantId));
      await tx.delete(answersTable).where(eq(answersTable.participantId, participantId));
      await tx.delete(participantsTable).where(eq(participantsTable.id, participantId));

      if (row) {
        await tx
          .update(dailyCountersTable)
          .set({ count: sql`${dailyCountersTable.count} - 1` })
          .where(
            and(
              eq(dailyCountersTable.eventId, row.eventId),
              eq(dailyCountersTable.date, row.date),
              gt(dailyCountersTable.count, 0),
            ),
          );
      }
    });
  },
};
