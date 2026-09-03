import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import { StaffBottomNav } from "@/components/staff/staff-bottom-nav";
import type { StaffOutletContext } from "@/client/hooks/use-staff-event-ctx";
import { ROUTES } from "@/lib/constants";
import type { EventSummary } from "@/types/event";

type State =
  | { status: "loading" }
  | { status: "unauthorized" }
  | { status: "not-found" }
  | { status: "admin" }
  | { status: "ready"; event: EventSummary; todayCount: number };

/**
 * 스태프 셸: 세션/담당행사 확인을 한 번만 하고 하위 탭(입장명단/스캔)에 행사 정보를 내려준다.
 * 관리자(ADMIN)로 들어오면 관리자 셸로 되돌려 보낸다.
 */
export default function StaffLayout() {
  const { eventId = "" } = useParams();
  const location = useLocation();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    fetch(`/api/staff/events/${encodeURIComponent(eventId)}`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 401) return setState({ status: "unauthorized" });
        if (res.status === 404) return setState({ status: "not-found" });
        if (!res.ok) throw new Error("failed to load staff event");
        const data = (await res.json()) as {
          event: EventSummary;
          todayCount: number;
          role: "STAFF" | "ADMIN";
        };
        if (data.role === "ADMIN") return setState({ status: "admin" });
        setState({ status: "ready", event: data.event, todayCount: data.todayCount });
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
      <Navigate to={`${ROUTES.staffLogin}?next=${encodeURIComponent(location.pathname)}`} replace />
    );
  }
  if (state.status === "not-found") return <Navigate to="/not-found" replace />;
  if (state.status === "admin") return <Navigate to={ROUTES.adminEvent(eventId)} replace />;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-x-hidden">
      <header className="sticky top-0 z-10 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <p className="text-xs text-muted-foreground">스태프</p>
        <h1 className="truncate text-base font-bold">{state.event.name}</h1>
      </header>
      <main className="min-w-0 flex-1 px-4 pt-4 pb-24">
        <Outlet
          context={
            { event: state.event, todayCount: state.todayCount } satisfies StaffOutletContext
          }
        />
      </main>
      <StaffBottomNav eventId={state.event.id} />
    </div>
  );
}
