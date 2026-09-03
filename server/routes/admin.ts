import type { Request, Response } from "express";
import { Router } from "express";
import { CHOICE_LABELS } from "@/lib/constants";
import { DEMO_EVENT } from "@/lib/data/demo-event";
import { getParticipantRepository, getStaffRepository } from "@/lib/db/provider";
import { todayDateString } from "@/lib/utils/date";
import { adminParticipantUpdateSchema } from "@/lib/validation/participant";
import type { AdminQuestionStat } from "@/types/admin";
import type { EventSummary } from "@/types/event";
import type { StaffSession } from "@/types/staff";
import { getStaffSession } from "../session";

export const adminRouter = Router();

/** 세션 확인 + ADMIN 역할 확인. 실패 시 응답을 직접 보내고 null을 반환한다. */
async function requireAdmin(req: Request, res: Response): Promise<StaffSession | null> {
  const session = await getStaffSession(req);
  if (!session) {
    res.status(401).json({ success: false, status: "UNAUTHORIZED" });
    return null;
  }
  if (session.role !== "ADMIN") {
    res.status(403).json({ success: false, status: "FORBIDDEN" });
    return null;
  }
  return session;
}

/** ADMIN 확인 + 그 관리자가 담당하는 행사인지 확인. 실패 시 응답을 보내고 null 반환. */
async function requireAssignedEvent(
  req: Request,
  res: Response,
  eventId: string,
): Promise<{ session: StaffSession; event: EventSummary } | null> {
  const session = await requireAdmin(req, res);
  if (!session) return null;

  const staffRepository = await getStaffRepository();
  const assignedEvents = await staffRepository.listAssignedEvents(session.staffId);
  const event = assignedEvents.find((e) => e.id === eventId);
  if (!event) {
    res.status(404).json({ success: false, status: "NOT_FOUND" });
    return null;
  }
  return { session, event };
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

adminRouter.get("/events", async (req, res) => {
  const session = await requireAdmin(req, res);
  if (!session) return;

  const staffRepository = await getStaffRepository();
  const events = await staffRepository.listAssignedEvents(session.staffId);
  res.json(events);
});

adminRouter.get("/events/:eventId/participants", async (req, res) => {
  const guard = await requireAssignedEvent(req, res, req.params.eventId);
  if (!guard) return;

  const rawDate = req.query.date;
  const date = typeof rawDate === "string" && DATE_PATTERN.test(rawDate) ? rawDate : todayDateString();

  const participantRepository = await getParticipantRepository();
  const participants = await participantRepository.listByEventAndDate(guard.event.id, date);
  res.json({ event: guard.event, date, participants });
});

adminRouter.get("/events/:eventId/stats", async (req, res) => {
  const guard = await requireAssignedEvent(req, res, req.params.eventId);
  if (!guard) return;

  const participantRepository = await getParticipantRepository();
  const [stats, answerCounts] = await Promise.all([
    participantRepository.getEventStats(guard.event.id),
    participantRepository.getAnswerCounts(guard.event.id),
  ]);

  const countByKey = new Map(answerCounts.map((c) => [`${c.questionId}:${c.choice}`, c.count]));
  // 문항 텍스트/선택지는 현재 데모 행사 정의에서 가져온다 (DB questions 연동 전까지).
  const questionSource = guard.event.id === DEMO_EVENT.id ? DEMO_EVENT.questions : [];
  const questions: AdminQuestionStat[] = questionSource
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((q) => {
      const choices = CHOICE_LABELS.map((label) => ({
        label,
        text: q.choices[label],
        count: countByKey.get(`${q.id}:${label}`) ?? 0,
      }));
      return {
        questionId: q.id,
        order: q.order,
        question: q.question,
        total: choices.reduce((sum, c) => sum + c.count, 0),
        choices,
      };
    });

  res.json({ stats, questions });
});

adminRouter.get("/events/:eventId/daily", async (req, res) => {
  const guard = await requireAssignedEvent(req, res, req.params.eventId);
  if (!guard) return;

  const participantRepository = await getParticipantRepository();
  const daily = await participantRepository.getDailyStats(guard.event.id);
  res.json({ daily });
});

adminRouter.get("/events/:eventId/daily.csv", async (req, res) => {
  const guard = await requireAssignedEvent(req, res, req.params.eventId);
  if (!guard) return;

  const participantRepository = await getParticipantRepository();
  const daily = await participantRepository.getDailyStats(guard.event.id);

  const rows = daily.map((d) => {
    const rate = d.registered > 0 ? ((d.checkedIn / d.registered) * 100).toFixed(1) : "0.0";
    return `${d.date},${d.registered},${d.checkedIn},${rate}%`;
  });
  // 앞에 UTF-8 BOM을 붙여 엑셀에서 한글이 깨지지 않게 한다.
  const bom = String.fromCharCode(0xFEFF);
  const csv = `${bom}날짜,등록,입장,입장률\r\n${rows.join("\r\n")}\r\n`;
  const filename = `${guard.event.slug}-daily-${todayDateString()}.csv`;

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
  );
  res.send(csv);
});

adminRouter.post("/participants/:participantId/check-in", async (req, res) => {
  const session = await requireAdmin(req, res);
  if (!session) return;

  const participantRepository = await getParticipantRepository();
  const result = await participantRepository.manualCheckIn(req.params.participantId, session.staffId);
  if (result.status === "NOT_FOUND") {
    res.status(404).json({ success: false, ...result });
    return;
  }
  res.json({ success: true, ...result });
});

adminRouter.post("/participants/:participantId/check-in/cancel", async (req, res) => {
  const session = await requireAdmin(req, res);
  if (!session) return;

  const participantRepository = await getParticipantRepository();
  await participantRepository.cancelCheckIn(req.params.participantId);
  res.json({ success: true });
});

adminRouter.patch("/participants/:participantId/check-in", async (req, res) => {
  const session = await requireAdmin(req, res);
  if (!session) return;

  const raw = (req.body ?? {}) as { checkedInAt?: unknown };
  const checkedInAt = typeof raw.checkedInAt === "string" ? new Date(raw.checkedInAt) : new Date(NaN);
  if (Number.isNaN(checkedInAt.getTime()) || checkedInAt.getTime() > Date.now()) {
    res.status(400).json({ success: false, status: "INVALID_INPUT" });
    return;
  }

  const participantRepository = await getParticipantRepository();
  const result = await participantRepository.updateCheckInTime(
    req.params.participantId,
    session.staffId,
    checkedInAt,
  );
  if (result.status === "NOT_FOUND") {
    res.status(404).json({ success: false, ...result });
    return;
  }
  res.json({ success: true, ...result });
});

adminRouter.patch("/participants/:participantId", async (req, res) => {
  const session = await requireAdmin(req, res);
  if (!session) return;

  const parsed = adminParticipantUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, status: "INVALID_INPUT", issues: parsed.error.issues });
    return;
  }

  const participantRepository = await getParticipantRepository();
  const result = await participantRepository.updateParticipant(req.params.participantId, parsed.data);
  if (result.status === "NOT_FOUND") {
    res.status(404).json({ success: false, ...result });
    return;
  }
  if (result.status === "DUPLICATE_PHONE") {
    res.status(409).json({ success: false, ...result });
    return;
  }
  res.json({ success: true, ...result });
});

adminRouter.delete("/participants/:participantId", async (req, res) => {
  const session = await requireAdmin(req, res);
  if (!session) return;

  const participantRepository = await getParticipantRepository();
  await participantRepository.remove(req.params.participantId);
  res.json({ success: true });
});
