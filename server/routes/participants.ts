import { Router } from "express";
import QRCode from "qrcode";
import { getParticipantRepository } from "@/lib/db/provider";
import { getEventBySlug } from "@/lib/events";
import { getNotificationSender } from "@/lib/notify";
import { generateQrToken, hashQrToken } from "@/lib/qr/token";
import { getQrImageStorage } from "@/lib/storage/provider";
import { customerNoFromId } from "@/lib/utils/customer-no";
import { participantSubmitSchema } from "@/lib/validation/participant";

export const participantsRouter = Router();

// 참가자 본인 QR 페이지(로그인 없음)가 조회한다.
// - 입장 여부: 스태프가 스캔하면 checked_in_at이 채워지고, 이 값을 2초 간격 폴링해 "입장 처리됨" 오버레이를 띄운다.
// - qrImageUrl: 개발(mock)에서는 카카오톡 없이 웹에서 바로 QR을 확인. 실연동 시에는 내려주지 않는다.
participantsRouter.get("/:participantId/status", async (req, res) => {
  const participantRepository = await getParticipantRepository();
  const status = await participantRepository.getParticipantStatus(req.params.participantId);
  if (!status) {
    res.status(404).json({ success: false, status: "NOT_FOUND" });
    return;
  }
  const isMockMode = (process.env.KAKAO_MODE ?? "mock") === "mock";

  // 개발(mock)에서 웹으로 바로 QR을 보여준다. 업로드된 이미지 URL이 있으면 그걸 쓰고,
  // 업로드가 실패해 없으면 저장해 둔 원문 토큰으로 그 자리에서 QR data URI를 만들어 fallback 한다.
  let qrImageUrl: string | null = null;
  if (isMockMode) {
    if (status.qrImageUrl) {
      qrImageUrl = status.qrImageUrl;
    } else if (status.qrToken) {
      qrImageUrl = await QRCode.toDataURL(status.qrToken, { width: 512 }).catch(() => null);
    }
  }

  res.json({
    success: true,
    checkedIn: status.checkedIn,
    customerNo: customerNoFromId(req.params.participantId),
    qrImageUrl,
  });
});

participantsRouter.post("/", async (req, res) => {
  const parsed = participantSubmitSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, status: "INVALID_INPUT", issues: parsed.error.issues });
    return;
  }
  const input = parsed.data;

  const event = await getEventBySlug(input.eventSlug);
  if (!event || event.status !== "ACTIVE") {
    res.status(404).json({ success: false, status: "INVALID_EVENT" });
    return;
  }

  const qrToken = generateQrToken();
  const qrTokenHash = hashQrToken(qrToken);

  const participantRepository = await getParticipantRepository();
  const result = await participantRepository.createIfCapacityAvailable(
    {
      eventId: event.id,
      name: input.name,
      phone: input.phone,
      privacyAgreed: input.privacyAgreed,
      marketingAgreed: input.marketingAgreed,
      answers: input.answers,
    },
    qrToken,
    qrTokenHash,
  );

  if (result.status === "FULL") {
    // 하루 선착순 정원 마감 — 참가자를 만들지 않고 바로 반환한다.
    res.status(409).json({ success: false, status: "DAILY_LIMIT_REACHED" });
    return;
  }
  if (result.status === "DUPLICATE_PHONE") {
    // 같은 행사에 같은 전화번호로 이미 등록되어 있음 — 중복 QR 발급 방지.
    res.status(409).json({ success: false, status: "DUPLICATE_PHONE" });
    return;
  }

  const { participant } = result;

  // 실제 QR PNG를 생성해 미디어 서버에 업로드한다 (draft.md §8: QR에는 개인정보를 담지 않고 랜덤 토큰만).
  // 업로드가 실패해도 참가자 등록/알림 자체는 계속 진행한다 (draft.md §30과 동일한 원칙).
  let qrImageUrl: string | null = null;
  try {
    const qrBuffer = await QRCode.toBuffer(qrToken, { width: 512 });
    const uploaded = await getQrImageStorage().uploadQrImage({
      eventId: event.id,
      participantId: participant.id,
      buffer: qrBuffer,
    });
    qrImageUrl = uploaded.url;
    await participantRepository.updateQrImageUrl(participant.id, qrImageUrl);
  } catch (err) {
    console.error("[qr-upload] 실패:", err);
  }

  const notifyResult = await getNotificationSender()
    .send(participant, qrToken, qrImageUrl)
    .catch(() => ({ status: "FAILED" as const }));
  await participantRepository.updateNotificationStatus(participant.id, notifyResult.status);

  // mock 단계에서는 실제 카카오톡이 없으므로, 화면에서 바로 QR을 확인할 수 있게
  // 데모 전용으로만 QR 이미지를 응답에 포함한다. 실연동(KAKAO_MODE=live) 시에는 내려주지 않는다.
  const isMockMode = (process.env.KAKAO_MODE ?? "mock") === "mock";

  res.json({
    success: true,
    status: "REGISTERED",
    notificationStatus: notifyResult.status,
    // 참가자 QR 페이지가 입장 여부를 폴링하고 "고객번호"를 표시하는 데 쓴다 (개인정보 아님).
    participantId: participant.id,
    customerNo: customerNoFromId(participant.id),
    ...(isMockMode ? { qrImageUrl, debugToken: qrToken } : {}),
  });
});
