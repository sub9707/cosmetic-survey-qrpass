import type { ChoiceLabel, NotificationStatus } from "@/lib/constants";

/** 관리자 통계 화면 상단 요약 지표 */
export interface AdminEventStats {
  /** 누적 참여자 수 (전체 기간) */
  totalParticipants: number;
  /** 누적 입장 완료 수 */
  totalCheckedIn: number;
  /** 오늘(KST) 등록한 참여자 수 */
  todayParticipants: number;
  /** 오늘(KST) 등록자 중 입장 완료 수 */
  todayCheckedIn: number;
  /** 마케팅 수신 동의자 수 */
  marketingAgreed: number;
  /** 알림톡 발송 상태별 집계 */
  notification: Record<NotificationStatus, number>;
}

/** 문항별 선택지 응답 분포 */
export interface AdminQuestionStat {
  questionId: string;
  order: number;
  question: string;
  /** 이 문항에 응답한 총 건수 */
  total: number;
  choices: { label: ChoiceLabel; text: string; count: number }[];
}

/** 일자별(KST 등록일 기준) 참여/입장 인원 */
export interface AdminDailyStat {
  /** YYYY-MM-DD (KST) */
  date: string;
  /** 그 날 등록한 참여자 수 */
  registered: number;
  /** 그 중 입장 완료한 수 */
  checkedIn: number;
}
