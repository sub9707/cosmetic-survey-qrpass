import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface DemoAccount {
  /** 버튼에 표시할 문구 */
  label: string;
  username: string;
  password: string;
  /** 로그인 성공 후 이동할 경로 */
  afterLoginPath: string;
}

interface DemoLoginFormProps {
  title: string;
  /** 계정이 1개면 ?next= 쿼리를 우선한다. 여러 개면 각 버튼의 afterLoginPath로 이동. */
  accounts: DemoAccount[];
}

/**
 * 데모 단계 전용 로그인: 계정을 입력받지 않고 버튼 클릭 한 번으로 고정 계정에 로그인한다.
 * 관리자 화면에서는 여러 계정(관리자/스태프)을 버튼으로 나열해 빠르게 전환할 수 있다.
 */
export function DemoLoginForm({ title, accounts }: DemoLoginFormProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pendingUser, setPendingUser] = useState<string | null>(null);

  async function login(account: DemoAccount) {
    setError(null);
    setPendingUser(account.username);

    try {
      const response = await fetch("/api/auth/staff-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: account.username, password: account.password }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError("로그인에 실패했어요. 잠시 후 다시 시도해주세요.");
        setPendingUser(null);
        return;
      }
    } catch {
      setError("로그인에 실패했어요. 잠시 후 다시 시도해주세요.");
      setPendingUser(null);
      return;
    }

    const target =
      accounts.length === 1
        ? searchParams.get("next") || account.afterLoginPath
        : account.afterLoginPath;
    navigate(target, { replace: true });
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">데모 계정으로 바로 로그인됩니다.</p>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-col gap-2">
            {accounts.map((account, i) => (
              <Button
                key={account.username}
                size="lg"
                variant={i === 0 ? "default" : "outline"}
                className="h-12 w-full"
                disabled={pendingUser !== null}
                onClick={() => login(account)}
              >
                {pendingUser === account.username ? "로그인 중..." : account.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
