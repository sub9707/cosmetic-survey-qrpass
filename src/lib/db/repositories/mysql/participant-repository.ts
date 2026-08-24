import { and, eq, gte, isNull, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { NotificationStatus } from "@/lib/constants";
import { mysqlDb } from "@/lib/db/client.mysql";
import {
  answers as answersTable,
  checkIns as checkInsTable,
  participants as participantsTable,
} from "@/lib/db/schema.mysql";
import type { ParticipantRepository } from "@/lib/db/repositories/types";
import type { CheckInResult } from "@/types/check-in";
import type { Participant, ParticipantInput } from "@/types/participant";

export const mysqlParticipantRepository: ParticipantRepository = {
  async create(input: ParticipantInput, qrTokenHash: string): Promise<Participant> {
    const id = randomUUID();
    const createdAt = new Date();

    await mysqlDb.transaction(async (tx) => {
      await tx.insert(participantsTable).values({
        id,
        eventId: input.eventId,
        name: input.name,
        phone: input.phone,
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
    });

    return {
      id,
      eventId: input.eventId,
      name: input.name,
      phone: input.phone,
      privacyAgreed: input.privacyAgreed,
      marketingAgreed: input.marketingAgreed,
      answers: input.answers,
      qrTokenHash,
      notificationStatus: "PENDING",
      checkedInAt: null,
      createdAt: createdAt.toISOString(),
    };
  },

  async updateNotificationStatus(participantId: string, status: NotificationStatus): Promise<void> {
    await mysqlDb
      .update(participantsTable)
      .set({ notificationStatus: status })
      .where(eq(participantsTable.id, participantId));
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
          participantName: latest.name,
          checkedInAt: (latest.checkedInAt ?? new Date()).toISOString(),
        };
      }

      await tx.insert(checkInsTable).values({
        id: randomUUID(),
        participantId: participant.id,
        staffId,
      });

      return { status: "CHECKED_IN", participantName: participant.name };
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
};
