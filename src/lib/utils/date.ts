/**
 * 서버(라즈베리파이)와 개발 머신의 OS 타임존이 다를 수 있어, "오늘 날짜" 판단은
 * 항상 이 함수로 통일한다 (하루 정원 카운터, 관리자 날짜별 조회에 사용).
 * en-CA 로케일은 YYYY-MM-DD 형식을 그대로 돌려준다.
 */
export function todayDateString(timeZone = "Asia/Seoul"): string {
  return new Date().toLocaleDateString("en-CA", { timeZone });
}
