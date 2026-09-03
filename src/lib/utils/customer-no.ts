/**
 * 참가자 UUID 앞 4자리를 대문자 식별코드로 만든다 (스태프/참가자 화면의 "고객번호[oooo]" 표시용).
 * 별도 번호 체계를 두지 않고 id에서 파생하므로 스키마 변경이 필요 없다.
 */
export function customerNoFromId(participantId: string): string {
  return participantId.replace(/-/g, "").slice(0, 4).toUpperCase();
}
