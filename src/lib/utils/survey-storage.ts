import type { ParticipantAnswer } from "@/types/participant";

/**
 * 설문 응답을 브라우저 sessionStorage에 임시 보관한다.
 * 설문(survey) 단계와 제출 폼(complete) 단계가 서로 다른 라우트라서,
 * 마지막 제출 시점까지 답변을 들고 넘기는 용도로만 쓴다 (draft.md §15).
 */
const storageKey = (eventSlug: string) => `qr-pass:survey:${eventSlug}`;

export function saveSurveyAnswers(eventSlug: string, answers: ParticipantAnswer[]) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(storageKey(eventSlug), JSON.stringify(answers));
}

export function loadSurveyAnswers(eventSlug: string): ParticipantAnswer[] {
  if (typeof window === "undefined") return [];
  const raw = sessionStorage.getItem(storageKey(eventSlug));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ParticipantAnswer[];
  } catch {
    return [];
  }
}

export function clearSurveyAnswers(eventSlug: string) {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(storageKey(eventSlug));
}

/**
 * 저장된 답변이 "이번 행사의 문항을 전부 채운, 유효한" 상태인지 확인한다.
 * 단순히 "값이 하나라도 있는지"만 보면, 예전에(같은 브라우저 탭에서) 설문을 하다 만
 * 이전 흔적이 남아 있을 때도 통과해버리는 문제가 있어 문항 id 전체 일치까지 확인한다.
 */
export function hasCompleteSurveyAnswers(eventSlug: string, questionIds: string[]): boolean {
  const answers = loadSurveyAnswers(eventSlug);
  if (answers.length !== questionIds.length) return false;
  const answeredIds = new Set(answers.map((a) => a.questionId));
  return questionIds.every((id) => answeredIds.has(id));
}
