import type { Request, Response } from "express";
import { Router } from "express";
import { getParticipantRepository, getStaffRepository } from "@/lib/db/provider";
import { todayDateString } from "@/lib/utils/date";
import { adminParticipantUpdateSchema } from "@/lib/validation/participant";
import type { EventSummary } from "@/types/event";
import type { StaffSession } from "@/types/staff";
import { getStaffSession } from "../session";

export const staffRouter = Router();

/** 로그인한 직원(STAFF 또는 ADMIN)인지 확인. 실패 시 응답을 보내고 null. */
async function requireSession(req: Request, res: Response): Promise<StaffSession | null> {
  const session = await getStaffSession(req);
  if (!session) {
    res.status(401).json({ success: false, status: "UNAUTHORIZED" });
    return null;
  }
  return session;
}

/** 세션 확인 + 담당 행사인지 확인. */
async function requireAssignedEvent(
  req: Request,
  res: Response,
  eventId: string,
): Promise<{ session: StaffSession; event: EventSummary } | null> {
  const session = await requireSession(req, res);
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

staffRouter.get("/events", async (req, res) => {
  const session = await requireSession(req, res);
  if (!session) return;
  const staffRepository = await getStaffRepository();
  const events = await staffRepository.listAssignedEvents(session.staffId);
  res.json(events);
});

// staff 셸 공용: 담당 행사인지 재확인 + 오늘 입장 수 + 역할(관리자면 클라이언트가 관리자 셸로 돌려보냄)
staffRouter.get("/events/:eventId", async (req, res) => {
  const guard = await requireAssignedEvent(req, res, req.params.eventId);
  if (!guard) return;

  const participantRepository = await getParticipantRepository();
  const todayCount = await participantRepository.countCheckedInToday(guard.event.id);
  res.json({ event: guard.event, todayCount, role: guard.session.role });
});

// 스태프 입장 명단: 그 날(KST) 입장 완료된 참가자만
staffRouter.get("/events/:eventId/roster", async (req, res) => {
  const guard = await requireAssignedEvent(req, res, req.params.eventId);
  if (!guard) return;

  const rawDate = req.query.date;
  const date =
    typeof rawDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : todayDateString();

  const participantRepository = await getParticipantRepository();
  const participants = await participantRepository.listCheckedInByDate(guard.event.id, date);
  res.json({ event: guard.event, date, participants });
});

staffRouter.patch("/participants/:participantId", async (req, res) => {
  const session = await requireSession(req, res);
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

staffRouter.post("/participants/:participantId/check-in/cancel", async (req, res) => {
  const session = await requireSession(req, res);
  if (!session) return;

  const participantRepository = await getParticipantRepository();
  await participantRepository.cancelCheckIn(req.params.participantId);
  res.json({ success: true });
});

staffRouter.delete("/participants/:participantId", async (req, res) => {
  const session = await requireSession(req, res);
  if (!session) return;

  const participantRepository = await getParticipantRepository();
  await participantRepository.remove(req.params.participantId);
  res.json({ success: true });
});
