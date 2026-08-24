import { NextResponse, type NextRequest } from "next/server";
import { verifyStaffToken } from "@/lib/auth/jwt";
import { ROUTES, STAFF_SESSION_COOKIE } from "@/lib/constants";

// 1차 방어(UX)일 뿐이고, 실제 권한 확인은 각 API 라우트에서 다시 한다 (draft.md §5).
export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === ROUTES.staffLogin) {
    return NextResponse.next();
  }

  const token = request.cookies.get(STAFF_SESSION_COOKIE)?.value;
  const session = token ? await verifyStaffToken(token) : null;

  if (!session) {
    const loginUrl = new URL(ROUTES.staffLogin, request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/staff/:path*"],
};
