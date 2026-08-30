import { maskPhone } from "@/lib/utils/phone";
import type { NotificationSender } from "@/lib/notify/provider";

/**
 * 실제 카카오 발신 프로필/템플릿 승인 전까지 쓰는 mock 발송기.
 * 전화번호는 절대 전체 노출하지 않고 마스킹해서만 로그한다 (draft.md §17).
 */
export const mockKakaoSender: NotificationSender = {
  async send(participant, _qrToken, qrImageUrl) {
    console.log(
      `[mock-kakao] 알림톡 발송 시뮬레이션 → ${maskPhone(participant.phone)} (participant=${participant.id})` +
        (qrImageUrl ? ` qr=${qrImageUrl}` : " qr=(업로드 실패/없음)"),
    );
    return { status: "SENT" };
  },
};
