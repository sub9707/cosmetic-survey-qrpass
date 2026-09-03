import type { ChoiceLabel, NotificationStatus } from "@/lib/constants";

export interface ParticipantAnswer {
  questionId: string;
  choice: ChoiceLabel;
}

export interface ParticipantInput {
  eventId: string;
  name: string;
  phone: string;
  privacyAgreed: boolean;
  marketingAgreed: boolean;
  answers: ParticipantAnswer[];
}

export interface Participant {
  id: string;
  eventId: string;
  name: string;
  phone: string;
  privacyAgreed: boolean;
  marketingAgreed: boolean;
  answers: ParticipantAnswer[];
  qrTokenHash: string;
  /** QR에 담기는 원문 토큰 (업로드 실패 시 QR 재생성용) */
  qrToken: string;
  /** 미디어 서버에 업로드된 실제 QR 이미지 URL (업로드 전/실패 시 null) */
  qrImageUrl: string | null;
  notificationStatus: NotificationStatus;
  checkedInAt: string | null;
  createdAt: string;
}

/** 관리자 날짜별 목록 화면에 쓰이는 요약 정보 */
export interface AdminParticipantSummary {
  id: string;
  name: string;
  phone: string;
  notificationStatus: NotificationStatus;
  checkedInAt: string | null;
  createdAt: string;
  qrImageUrl: string | null;
}
