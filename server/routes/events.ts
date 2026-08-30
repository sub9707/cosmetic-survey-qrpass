import { Router } from "express";
import { getParticipantRepository } from "@/lib/db/provider";
import { getEventBySlug } from "@/lib/events";

export const eventsRouter = Router();

eventsRouter.get("/:slug", async (req, res) => {
  const event = await getEventBySlug(req.params.slug);
  // status가 ACTIVE가 아닌 행사는 존재 자체를 숨긴다 (직접 URL 접근 차단).
  if (!event || event.status !== "ACTIVE") {
    res.status(404).json({ success: false, status: "NOT_FOUND" });
    return;
  }

  const participantRepository = await getParticipantRepository();
  const dailyCapacity = await participantRepository.getDailyCapacity(event.id);

  res.json({ ...event, dailyCapacity });
});
