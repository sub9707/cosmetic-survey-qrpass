import { createHash, randomUUID } from "node:crypto";

/** QR에는 개인정보를 담지 않고, 랜덤 토큰만 담는다 (draft.md §8) */
export function generateQrToken(): string {
  return randomUUID();
}

/** 원문 토큰은 저장하지 않고 해시만 저장한다 (draft.md §7) */
export function hashQrToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
