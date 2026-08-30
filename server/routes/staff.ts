import { Router } from "express";
import { getParticipantRepository, getStaffRepository } from "@/lib/db/provider";
import { getStaffSession } from "../session";

export const staffRouter = Router();

staffRouter.get("/events", async (req, res) => {
  const session = await getStaffSession(req);
  if (!session) {
    res.status(401).json({ success: false, status: "UNAUTHORIZED" });
    return;
  }
  const staffRepository = await getStaffRepository();
  const events = await staffRepository.listAssignedEvents(session.staffId);
  res.json(events);
});

// staff 홈/스캐너 화면 공용: 담당 행사인지 재확인 + 오늘 입장 수 (draft.md §23)
staffRouter.get("/events/:eventId", async (req, res) => {
  const session = await getStaffSession(req);
  if (!session) {
    res.status(401).json({ success: false, status: "UNAUTHORIZED" });
    return;
  }

  const staffRepository = await getStaffRepository();
  const assignedEvents = await staffRepository.listAssignedEvents(session.staffId);
  const event = assignedEvents.find((e) => e.id === req.params.eventId);
  if (!event) {
    res.status(404).json({ success: false, status: "NOT_FOUND" });
    return;
  }

  const participantRepository = await getParticipantRepository();
  const todayCount = await participantRepository.countCheckedInToday(event.id);
  res.json({ event, todayCount });
});
