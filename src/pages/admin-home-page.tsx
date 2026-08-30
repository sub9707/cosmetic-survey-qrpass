import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ROUTES } from "@/lib/constants";
import type { EventSummary } from "@/types/event";

type State = { status: "loading" } | { status: "unauthorized" } | { status: "ready"; events: EventSummary[] };

export default function AdminHomePage() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/events")
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 401 || res.status === 403) {
          setState({ status: "unauthorized" });
          return;
        }
        if (!res.ok) throw new Error("failed to load events");
        setState({ status: "ready", events: (await res.json()) as EventSummary[] });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "unauthorized" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") return null;
  if (state.status === "unauthorized") {
    return <Navigate to={`${ROUTES.adminLogin}?next=${encodeURIComponent(ROUTES.admin)}`} replace />;
  }

  const { events } = state;
  if (events.length === 0) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4 text-center">
        <p className="text-sm text-muted-foreground">배정된 행사가 없습니다.</p>
      </div>
    );
  }

  if (events.length === 1) {
    return <Navigate to={ROUTES.adminEvent(events[0].id)} replace />;
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-3 px-4">
      <h1 className="mb-2 text-lg font-bold">관리할 행사를 선택해주세요</h1>
      {events.map((event) => (
        <Link
          key={event.id}
          to={ROUTES.adminEvent(event.id)}
          className="rounded-lg border px-4 py-3 font-medium hover:bg-muted"
        >
          {event.name}
        </Link>
      ))}
    </div>
  );
}
