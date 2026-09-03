import { useEffect, useState } from "react";
import type { AdminEventStats, AdminQuestionStat } from "@/types/admin";

export type AdminStatsState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; stats: AdminEventStats; questions: AdminQuestionStat[] };

/** 관리자 통계 화면: GET /api/admin/events/:eventId/stats */
export function useAdminStats(eventId: string | undefined): AdminStatsState {
  const [state, setState] = useState<AdminStatsState>({ status: "loading" });

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    setState({ status: "loading" });

    fetch(`/api/admin/events/${encodeURIComponent(eventId)}/stats`)
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) throw new Error("failed to load stats");
        const data = (await res.json()) as { stats: AdminEventStats; questions: AdminQuestionStat[] };
        setState({ status: "ready", stats: data.stats, questions: data.questions });
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
