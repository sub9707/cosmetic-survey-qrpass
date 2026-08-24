import { cookies } from "next/headers";
import { signStaffToken, verifyStaffToken } from "@/lib/auth/jwt";
import { STAFF_SESSION_COOKIE, STAFF_SESSION_TTL_SECONDS } from "@/lib/constants";
import type { StaffSession } from "@/types/staff";

export async function createStaffSession(session: StaffSession): Promise<void> {
  const token = await signStaffToken(session);
  const store = await cookies();
  store.set(STAFF_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: STAFF_SESSION_TTL_SECONDS,
  });
}

/** 서버 컴포넌트/API 라우트에서 현재 로그인한 직원을 확인할 때 사용 (매 요청 재검증, draft.md §5) */
export async function getStaffSession(): Promise<StaffSession | null> {
  const store = await cookies();
  const token = store.get(STAFF_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyStaffToken(token);
}

export async function clearStaffSession(): Promise<void> {
  const store = await cookies();
  store.delete(STAFF_SESSION_COOKIE);
}
