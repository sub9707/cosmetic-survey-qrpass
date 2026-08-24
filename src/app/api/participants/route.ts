import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { getParticipantRepository } from "@/lib/db/provider";
import { getEventBySlug } from "@/lib/events";
import { getNotificationSender } from "@/lib/notify";
import { generateQrToken, hashQrToken } from "@/lib/qr/token";
import { participantSubmitSchema } from "@/lib/validation/participant";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = participantSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, status: "INVALID_INPUT", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const input = parsed.data;

  const event = await getEventBySlug(input.eventSlug);
  if (!event) {
    return NextResponse.json({ success: false, status: "INVALID_EVENT" }, { status: 404 });
  }

  const qrToken = generateQrToken();
  const qrTokenHash = hashQrToken(qrToken);

  const participantRepository = await getParticipantRepository();
  const participant = await participantRepository.create(
    {
      eventId: event.id,
      name: input.name,
      phone: input.phone,
      privacyAgreed: input.privacyAgreed,
      marketingAgreed: input.marketingAgreed,
      answers: input.answers,
    },
    qrTokenHash,
  );

  // 카카오 발송 실패가 참가자 등록 자체를 롤백하면 안 된다 (draft.md §30)
  const notifyResult = await getNotificationSender()
    .send(participant, qrToken)
    .catch(() => ({ status: "FAILED" as const }));
  await participantRepository.updateNotificationStatus(participant.id, notifyResult.status);

  // mock 단계에서는 실제 카카오톡이 없으므로, 화면에서 바로 QR을 확인할 수 있게
  // 데모 전용으로만 QR 이미지를 응답에 포함한다. 실연동(KAKAO_MODE=live) 시에는 내려주지 않는다.
  const isMockMode = (process.env.KAKAO_MODE ?? "mock") === "mock";
  const debugQrDataUrl = isMockMode ? await QRCode.toDataURL(qrToken) : undefined;

  return NextResponse.json({
    success: true,
    status: "REGISTERED",
    notificationStatus: notifyResult.status,
    ...(isMockMode ? { debugQrDataUrl, debugToken: qrToken } : {}),
  });
}
