import { NextResponse } from "next/server";
import { getStaffSession } from "@/lib/auth/session";
import { getParticipantRepository } from "@/lib/db/provider";
import { hashQrToken } from "@/lib/qr/token";
import { checkInSchema } from "@/lib/validation/staff";

// QR check-in API는 최대한 작게: 인증 → token 검증 → atomic check-in → 결과 반환.
// 카카오 발송, 통계 계산 등 무거운 작업은 여기서 하지 않는다 (draft.md §28).
export async function POST(request: Request) {
  const session = await getStaffSession();
  if (!session) {
    return NextResponse.json({ success: false, status: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = checkInSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, status: "INVALID_QR" }, { status: 400 });
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
      return NextResponse.json({
        success: true,
        status: "CHECKED_IN",
        participant: { name: result.participantName },
      });
    }

    if (result.status === "ALREADY_CHECKED_IN") {
      return NextResponse.json({
        success: false,
        status: "ALREADY_CHECKED_IN",
        participant: { name: result.participantName },
        checkedInAt: result.checkedInAt,
      });
    }

    return NextResponse.json({ success: false, status: result.status });
  } catch {
    return NextResponse.json({ success: false, status: "SERVER_ERROR" }, { status: 500 });
  }
}
