import { useEffect, useState } from "react";
import type { EventSummary } from "@/types/event";

export type StaffEventQueryState =
  | { status: "loading" }
  | { status: "unauthorized" }
  | { status: "not-found" }
  | { status: "ready"; event: EventSummary; todayCount: number };

/**
 * staff 홈/스캐너 화면 공용: GET /api/staff/events/:eventId
 * (구 getStaffSession + listAssignedEvents + countCheckedInToday 서버 조회 대체, draft.md §23)
 */
export function useStaffEvent(eventId: string | undefined): StaffEventQueryState {
  const [state, setState] = useState<StaffEventQueryState>({ status: "loading" });

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    setState({ status: "loading" });

    fetch(`/api/staff/events/${encodeURIComponent(eventId)}`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 401) {
          setState({ status: "unauthorized" });
          return;
        }
        if (res.status === 404) {
          setState({ status: "not-found" });
          return;
        }
        if (!res.ok) throw new Error("failed to load staff event");
        const data = (await res.json()) as { event: EventSummary; todayCount: number };
        setState({ status: "ready", event: data.event, todayCount: data.todayCount });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "unauthorized" });
      });

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  return state;
}
