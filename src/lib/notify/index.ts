import { mockKakaoSender } from "@/lib/notify/mock";
import type { NotificationSender } from "@/lib/notify/provider";

/** KAKAO_MODE=mock|live 값에 따라 실제 발송기를 고르는 자리. 실연동 전까지는 mock만 연결. */
export function getNotificationSender(): NotificationSender {
  return mockKakaoSender;
}
