import type { Request, Response } from "express";
import { Router } from "express";
import { getParticipantRepository, getStaffRepository } from "@/lib/db/provider";
import { todayDateString } from "@/lib/utils/date";
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

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

adminRouter.get("/events", async (req, res) => {
  const session = await requireAdmin(req, res);
  if (!session) return;

  const staffRepository = await getStaffRepository();
  const events = await staffRepository.listAssignedEvents(session.staffId);
  res.json(events);
});

adminRouter.get("/events/:eventId/participants", async (req, res) => {
  const session = await requireAdmin(req, res);
  if (!session) return;

  const staffRepository = await getStaffRepository();
  const assignedEvents = await staffRepository.listAssignedEvents(session.staffId);
  const event = assignedEvents.find((e) => e.id === req.params.eventId);
  if (!event) {
    res.status(404).json({ success: false, status: "NOT_FOUND" });
    return;
  }

  const rawDate = req.query.date;
  const date = typeof rawDate === "string" && DATE_PATTERN.test(rawDate) ? rawDate : todayDateString();

  const participantRepository = await getParticipantRepository();
  const participants = await participantRepository.listByEventAndDate(event.id, date);
  res.json({ event, date, participants });
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

adminRouter.delete("/participants/:participantId", async (req, res) => {
  const session = await requireAdmin(req, res);
  if (!session) return;

  const participantRepository = await getParticipantRepository();
  await participantRepository.remove(req.params.participantId);
  res.json({ success: true });
});
