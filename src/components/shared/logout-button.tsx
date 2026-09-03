import { LogOut } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

/** 스태프/관리자 셸 헤더의 로그아웃 버튼. 세션 쿠키를 지우고 해당 로그인 화면으로 보낸다. */
export function LogoutButton({ redirectTo }: { redirectTo: string }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/auth/staff-logout", { method: "POST" });
    } catch {
      // 네트워크 오류여도 클라이언트는 로그인 화면으로 보낸다.
    }
    navigate(redirectTo, { replace: true });
  }

  return (
    <Button variant="outline" size="sm" onClick={logout} disabled={loading}>
      <LogOut />
      로그아웃
    </Button>
  );
}
