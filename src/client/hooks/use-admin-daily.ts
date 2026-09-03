import { useEffect, useState } from "react";
import type { AdminDailyStat } from "@/types/admin";

export type AdminDailyState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; daily: AdminDailyStat[] };

/** 관리자 일자별 참여 인원: GET /api/admin/events/:eventId/daily */
export function useAdminDaily(eventId: string | undefined): AdminDailyState {
  const [state, setState] = useState<AdminDailyState>({ status: "loading" });

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    setState({ status: "loading" });

    fetch(`/api/admin/events/${encodeURIComponent(eventId)}/daily`)
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) throw new Error("failed to load daily stats");
        const data = (await res.json()) as { daily: AdminDailyStat[] };
        setState({ status: "ready", daily: data.daily });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  return state;
}
