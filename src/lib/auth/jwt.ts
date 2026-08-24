import { jwtVerify, SignJWT } from "jose";
import { STAFF_SESSION_TTL_SECONDS, type StaffRole } from "@/lib/constants";
import type { StaffSession } from "@/types/staff";

// jose(Web Crypto 기반)를 쓰는 이유: middleware.ts는 Edge 런타임에서 실행되고,
// 이후 Cloudflare Workers로 옮길 때도 그대로 동작해야 한다 (draft-modular-coral.md §1).
function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("환경변수 JWT_SECRET이 설정되지 않았습니다. .env.local을 확인하세요.");
  }
  return new TextEncoder().encode(secret);
}

export async function signStaffToken(session: StaffSession): Promise<string> {
  return new SignJWT({ staffId: session.staffId, name: session.name, role: session.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${STAFF_SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifyStaffToken(token: string): Promise<StaffSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      typeof payload.staffId !== "string" ||
      typeof payload.name !== "string" ||
      typeof payload.role !== "string"
    ) {
      return null;
    }
    return { staffId: payload.staffId, name: payload.name, role: payload.role as StaffRole };
  } catch {
    return null;
  }
}
