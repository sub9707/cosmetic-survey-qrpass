import { useEffect, useState } from "react";
import type { DailyCapacity, EventDetail } from "@/types/event";

export type EventQueryState =
  | { status: "loading" }
  | { status: "ready"; event: EventDetail; dailyCapacity: DailyCapacity }
  | { status: "not-found" };

/** 행사 랜딩/설문/완료 페이지 공용: GET /api/events/:slug (구 getEventBySlug 서버 조회 대체) */
export function useEvent(eventSlug: string | undefined): EventQueryState {
  const [state, setState] = useState<EventQueryState>({ status: "loading" });

  useEffect(() => {
    if (!eventSlug) return;
    let cancelled = false;
    setState({ status: "loading" });

    fetch(`/api/events/${encodeURIComponent(eventSlug)}`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 404) {
          setState({ status: "not-found" });
          return;
        }
        if (!res.ok) throw new Error("failed to load event");
        const { dailyCapacity, ...event } = (await res.json()) as EventDetail & {
          dailyCapacity: DailyCapacity;
        };
        setState({ status: "ready", event, dailyCapacity });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "not-found" });
      });

    return () => {
      cancelled = true;
    };
  }, [eventSlug]);

  return state;
}
