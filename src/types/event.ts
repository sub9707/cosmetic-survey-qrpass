import type { ChoiceLabel, EventStatus } from "@/lib/constants";

/** 이벤트별 커스텀 테마. 지정하지 않으면 기본(핑크) 테마 사용 */
export interface EventTheme {
  primary: string;
  primaryForeground: string;
  primarySoft: string;
}

export interface EventSurveyQuestion {
  id: string;
  order: number;
  question: string;
  choices: Record<ChoiceLabel, string>;
}

/** 결과/동의 화면에 쓰이는 행사별 문구. 지정하지 않으면 기본 문구를 쓴다. */
export interface EventCopy {
  resultHeadline: string;
  resultSubline: string;
  privacyConsentLabel: string;
  marketingConsentLabel: string;
}

export interface EventSummary {
  id: string;
  slug: string;
  name: string;
  status: EventStatus;
  theme?: EventTheme;
  copy?: Partial<EventCopy>;
  /** 텍스트 대신 쓸 로고 이미지. 지정하지 않으면 name을 텍스트로 렌더링한다. */
  logo?: { src: string; width: number; height: number };
}

export interface EventDetail extends EventSummary {
  questions: EventSurveyQuestion[];
}

/** 하루 선착순 정원 현황 (랜딩 페이지 CTA 활성/비활성 판단용) */
export interface DailyCapacity {
  limit: number;
  count: number;
  isFull: boolean;
}
