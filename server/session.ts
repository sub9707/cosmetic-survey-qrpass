import type { Request, Response } from "express";
import { signStaffToken, verifyStaffToken } from "@/lib/auth/jwt";
import { STAFF_SESSION_COOKIE, STAFF_SESSION_TTL_SECONDS } from "@/lib/constants";
import type { StaffSession } from "@/types/staff";

export async function createStaffSession(res: Response, session: StaffSession): Promise<void> {
  const token = await signStaffToken(session);
  res.cookie(STAFF_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    path: "/",
    maxAge: STAFF_SESSION_TTL_SECONDS * 1000, // Express는 ms 단위
  });
}

/** 각 API 라우트에서 현재 로그인한 직원을 확인할 때 사용 (매 요청 재검증, draft.md §5) */
export async function getStaffSession(req: Request): Promise<StaffSession | null> {
  const token = req.cookies?.[STAFF_SESSION_COOKIE] as string | undefined;
  if (!token) return null;
  return verifyStaffToken(token);
}

export function clearStaffSession(res: Response): void {
  res.clearCookie(STAFF_SESSION_COOKIE, { path: "/" });
}
