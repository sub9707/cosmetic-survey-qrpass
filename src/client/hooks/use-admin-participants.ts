import { useCallback, useEffect, useState } from "react";
import { todayDateString } from "@/lib/utils/date";
import type { AdminParticipantSummary } from "@/types/participant";
import type { EventSummary } from "@/types/event";

export type AdminParticipantsState =
  | { status: "loading" }
  | { status: "unauthorized" }
  | { status: "not-found" }
  | { status: "ready"; event: EventSummary; participants: AdminParticipantSummary[] };

/** 관리자 대시보드 공용: 날짜별 참가자 목록 조회 + 재조회, 입장 확인/취소/삭제 액션. */
export function useAdminParticipants(eventId: string | undefined) {
  const [date, setDate] = useState(() => todayDateString());
  const [state, setState] = useState<AdminParticipantsState>({ status: "loading" });
  const [actionError, setActionError] = useState<string | null>(null);

  const reload = useCallback(() => {
    if (!eventId) return;
    let cancelled = false;
    setState((prev) => (prev.status === "ready" ? prev : { status: "loading" }));

    fetch(`/api/admin/events/${encodeURIComponent(eventId)}/participants?date=${date}`)
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
        if (!res.ok) throw new Error("failed to load participants");
        const data = (await res.json()) as { event: EventSummary; participants: AdminParticipantSummary[] };
        setState({ status: "ready", event: data.event, participants: data.participants });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "unauthorized" });
      });

    return () => {
      cancelled = true;
    };
  }, [eventId, date]);

  useEffect(() => reload(), [reload]);

  async function checkIn(participantId: string) {
    setActionError(null);
    const res = await fetch(`/api/admin/participants/${participantId}/check-in`, { method: "POST" });
    if (!res.ok) {
      setActionError("입장 확인 처리에 실패했어요.");
      return;
    }
    reload();
  }

  async function cancelCheckIn(participantId: string) {
    setActionError(null);
    const res = await fetch(`/api/admin/participants/${participantId}/check-in/cancel`, { method: "POST" });
    if (!res.ok) {
      setActionError("입장 취소 처리에 실패했어요.");
      return;
    }
    reload();
  }

  async function removeParticipant(participantId: string) {
    setActionError(null);
    const res = await fetch(`/api/admin/participants/${participantId}`, { method: "DELETE" });
    if (!res.ok) {
      setActionError("삭제에 실패했어요.");
      return;
    }
    reload();
  }

  async function updateParticipant(
    participantId: string,
    input: { name: string; phone: string },
  ): Promise<{ ok: true } | { ok: false; message: string }> {
    setActionError(null);
    const res = await fetch(`/api/admin/participants/${participantId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (res.status === 409) {
      return { ok: false, message: "이미 이 행사에 같은 번호로 등록된 참여자가 있어요." };
    }
    if (!res.ok) return { ok: false, message: "수정에 실패했어요." };
    reload();
    return { ok: true };
  }

  /** checkedInAtIso: 표준 ISO 문자열 (호출부에서 로컬 입력값을 변환해 전달) */
  async function updateCheckInTime(
    participantId: string,
    checkedInAtIso: string,
  ): Promise<{ ok: true } | { ok: false; message: string }> {
    setActionError(null);
    const res = await fetch(`/api/admin/participants/${participantId}/check-in`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkedInAt: checkedInAtIso }),
    });
    if (!res.ok) return { ok: false, message: "입장 시각 수정에 실패했어요." };
    reload();
    return { ok: true };
  }

  return {
    date,
    setDate,
    state,
    actionError,
    checkIn,
    cancelCheckIn,
    removeParticipant,
    updateParticipant,
    updateCheckInTime,
  };
}
