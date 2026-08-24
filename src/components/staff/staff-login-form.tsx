"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEMO_STAFF_PASSWORD, DEMO_STAFF_USERNAME } from "@/lib/constants";

/**
 * 데모 단계 전용: 계정을 직접 입력받지 않고, 버튼 클릭 한 번으로
 * 고정된 데모 계정(DEMO_STAFF_USERNAME/PASSWORD)으로 바로 로그인한다.
 */
export function StaffLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  async function handleLogin() {
    setError(null);
    setIsLoggingIn(true);

    const response = await fetch("/api/auth/staff-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: DEMO_STAFF_USERNAME, password: DEMO_STAFF_PASSWORD }),
    });
    const data = await response.json();

    if (!response.ok || !data.success) {
      setError("로그인에 실패했어요. 잠시 후 다시 시도해주세요.");
      setIsLoggingIn(false);
      return;
    }

    router.push(searchParams.get("next") || "/staff");
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>직원 로그인</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username">아이디</Label>
            <Input id="username" value={DEMO_STAFF_USERNAME} disabled readOnly />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">비밀번호</Label>
            <Input id="password" type="password" value={DEMO_STAFF_PASSWORD} disabled readOnly />
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
