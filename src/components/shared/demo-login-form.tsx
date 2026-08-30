import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DemoLoginFormProps {
  title: string;
  demoUsername: string;
  demoPassword: string;
  /** 로그인 성공 후 이동할 기본 경로 (쿼리스트링 ?next=가 있으면 그쪽을 우선한다) */
  afterLoginPath: string;
}

/**
 * 데모 단계 전용 공통 로그인 폼: 계정을 직접 입력받지 않고, 버튼 클릭 한 번으로
 * 고정된 데모 계정으로 바로 로그인한다. 스태프/관리자 로그인 화면이 이 컴포넌트를 공유한다.
 */
export function DemoLoginForm({ title, demoUsername, demoPassword, afterLoginPath }: DemoLoginFormProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  async function handleLogin() {
    setError(null);
    setIsLoggingIn(true);

    const response = await fetch("/api/auth/staff-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: demoUsername, password: demoPassword }),
    });
    const data = await response.json();

    if (!response.ok || !data.success) {
      setError("로그인에 실패했어요. 잠시 후 다시 시도해주세요.");
      setIsLoggingIn(false);
      return;
    }

    navigate(searchParams.get("next") || afterLoginPath);
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username">아이디</Label>
            <Input id="username" value={demoUsername} disabled readOnly />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">비밀번호</Label>
            <Input id="password" type="password" value={demoPassword} disabled readOnly />
          </div>
          <p className="text-xs text-muted-foreground">데모 계정으로 바로 로그인됩니다.</p>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button size="lg" className="h-12 w-full" disabled={isLoggingIn} onClick={handleLogin}>
            {isLoggingIn ? "로그인 중..." : "로그인"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
