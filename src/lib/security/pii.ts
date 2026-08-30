import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";

/**
 * 참가자 이름/전화번호처럼 "다시 평문으로 보여줘야 하는" 개인정보를 저장할 때 쓰는
 * 양방향 암호화 (draft.md §7의 qrTokenHash 단방향 해시와는 목적이 다름 — 체크인 화면/
 * 관리자 대시보드에서 원문을 다시 보여줘야 하므로 해시가 아니라 암호화를 쓴다).
 *
 * ⚠️ PII_ENCRYPTION_KEY를 분실하거나 교체하면 그 전에 저장된 값은 복호화할 수 없고,
 * hashPhoneForLookup으로 만든 조회용 해시도 값이 달라져 중복확인이 깨진다. 안전하게 보관할 것.
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // GCM 권장 IV 길이

function getKey(): Buffer {
  const key = process.env.PII_ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      "환경변수 PII_ENCRYPTION_KEY가 설정되지 않았습니다. `openssl rand -hex 32`로 생성해 .env.local에 넣어주세요.",
    );
  }
  const buf = Buffer.from(key, "hex");
  if (buf.length !== 32) {
    throw new Error("PII_ENCRYPTION_KEY는 32바이트(64자리 hex)여야 합니다.");
  }
  return buf;
}

/** 저장 포맷: "<ivHex>:<authTagHex>:<cipherHex>" */
export function encryptPii(plain: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptPii(stored: string): string {
  const [ivHex, authTagHex, cipherHex] = stored.split(":");
  if (!ivHex || !authTagHex || !cipherHex) {
    throw new Error("암호화된 값의 형식이 올바르지 않습니다.");
  }
  const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(cipherHex, "hex")), decipher.final()]);
  return decrypted.toString("utf8");
}

/**
 * 전화번호 중복등록 확인용 "블라인드 인덱스". 값이 같으면 항상 같은 해시가 나와야
 * DB에서 WHERE/UNIQUE로 조회할 수 있다 (encryptPii는 매번 IV가 달라 조회에 못 씀).
 * 휴대폰 번호는 010+8자리라 경우의 수가 적어(약 1억 개) 키 없는 SHA256은 레인보우테이블로
 * 역산 가능하므로, 반드시 비밀키를 쓰는 HMAC으로 만든다.
 */
export function hashPhoneForLookup(normalizedPhone: string): string {
  return createHmac("sha256", getKey()).update(normalizedPhone).digest("hex");
}
