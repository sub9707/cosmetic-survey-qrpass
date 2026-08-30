import { Router } from "express";
import { getParticipantRepository } from "@/lib/db/provider";
import { hashQrToken } from "@/lib/qr/token";
import { checkInSchema } from "@/lib/validation/staff";
import { getStaffSession } from "../session";

export const checkInRouter = Router();

// QR check-in API는 최대한 작게: 인증 → token 검증 → atomic check-in → 결과 반환.
// 카카오 발송, 통계 계산 등 무거운 작업은 여기서 하지 않는다 (draft.md §28).
checkInRouter.post("/", async (req, res) => {
  const session = await getStaffSession(req);
  if (!session) {
    res.status(401).json({ success: false, status: "UNAUTHORIZED" });
    return;
  }

  const parsed = checkInSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, status: "INVALID_QR" });
    return;
  }

  try {
    const qrTokenHash = hashQrToken(parsed.data.token);
    const participantRepository = await getParticipantRepository();
    const result = await participantRepository.atomicCheckIn({
      qrTokenHash,
      eventId: parsed.data.eventId,
      staffId: session.staffId,
    });

    if (result.status === "CHECKED_IN") {
      res.json({ success: true, status: "CHECKED_IN", participant: { name: result.participantName } });
      return;
    }

    if (result.status === "ALREADY_CHECKED_IN") {
      res.json({
        success: false,
        status: "ALREADY_CHECKED_IN",
        participant: { name: result.participantName },
        checkedInAt: result.checkedInAt,
      });
      return;
    }

    res.json({ success: false, status: result.status });
  } catch {
    res.status(500).json({ success: false, status: "SERVER_ERROR" });
  }
});
