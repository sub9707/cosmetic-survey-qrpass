const DIGITS_ONLY = /\D/g;
const KR_MOBILE = /^01[0-9]\d{7,8}$/;

export function normalizePhone(raw: string): string {
  return raw.replace(DIGITS_ONLY, "");
}

export function isValidKoreanMobile(raw: string): boolean {
  return KR_MOBILE.test(normalizePhone(raw));
}

/** 010-1234-5678 형태로 표시용 포맷 */
export function formatPhone(raw: string): string {
  const digits = normalizePhone(raw);
  if (digits.length < 4) return digits;
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length <= 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
}

/** 로그/화면 노출용 마스킹: 010****1234 (draft.md §17) */
export function maskPhone(raw: string): string {
  const digits = normalizePhone(raw);
  if (digits.length < 7) return "***";
  const head = digits.slice(0, 3);
  const tail = digits.slice(-4);
  return `${head}****${tail}`;
}
