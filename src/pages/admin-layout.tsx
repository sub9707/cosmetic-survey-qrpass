import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import { AdminBottomNav } from "@/components/admin/admin-bottom-nav";
import { LogoutButton } from "@/components/shared/logout-button";
import type { AdminOutletContext } from "@/client/hooks/use-admin-event";
import { ROUTES } from "@/lib/constants";
import type { EventSummary } from "@/types/event";

type State =
  | { status: "loading" }
  | { status: "unauthorized" }
  | { status: "not-found" }
  | { status: "ready"; event: EventSummary };

/**
 * 관리자 대시보드 공용 셸: 세션/담당행사 검증을 한 번만 하고,
 * 하위 라우트(통계/일자별/참여자/입장)에 행사 정보를 내려준다. 모바일 우선 레이아웃.
 */
export default function AdminLayout() {
  const { eventId = "" } = useParams();
  const location = useLocation();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    fetch("/api/admin/events")
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 401 || res.status === 403) {
          setState({ status: "unauthorized" });
          return;
        }
        if (!res.ok) throw new Error("failed to load events");
        const events = (await res.json()) as EventSummary[];
        const event = events.find((e) => e.id === eventId);
        setState(event ? { status: "ready", event } : { status: "not-found" });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "unauthorized" });
      });

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  if (state.status === "loading") return null;
  if (state.status === "unauthorized") {
    return (
      <Navigate
        to={`${ROUTES.adminLogin}?next=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }
  if (state.status === "not-found") return <Navigate to="/not-found" replace />;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-x-hidden">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">관리자</p>
          <h1 className="truncate text-base font-bold">{state.event.name}</h1>
        </div>
        <LogoutButton redirectTo={ROUTES.adminLogin} />
      </header>
      <main className="min-w-0 flex-1 px-4 pt-4 pb-24">
        <Outlet context={{ event: state.event } satisfies AdminOutletContext} />
      </main>
      <AdminBottomNav eventId={state.event.id} />
    </div>
  );
}
