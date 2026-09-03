import { useCallback, useEffect, useState } from "react";
import type { AdminParticipantSummary } from "@/types/participant";

export type StaffRosterState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; participants: AdminParticipantSummary[] };

type ActionResult = { ok: true } | { ok: false; message: string };

/** 스태프 입장 명단: 오늘 입장한 참가자 목록 + 수정/입장취소/삭제. */
export function useStaffRoster(eventId: string | undefined) {
  const [state, setState] = useState<StaffRosterState>({ status: "loading" });
  const [actionError, setActionError] = useState<string | null>(null);

  const reload = useCallback(() => {
    if (!eventId) return;
    let cancelled = false;
    setState((prev) => (prev.status === "ready" ? prev : { status: "loading" }));

    fetch(`/api/staff/events/${encodeURIComponent(eventId)}/roster`)
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) throw new Error("failed to load roster");
        const data = (await res.json()) as { participants: AdminParticipantSummary[] };
        setState({ status: "ready", participants: data.participants });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  useEffect(() => reload(), [reload]);

  async function updateParticipant(
    participantId: string,
    input: { name: string; phone: string },
  ): Promise<ActionResult> {
    setActionError(null);
    const res = await fetch(`/api/staff/participants/${participantId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (res.status === 409) return { ok: false, message: "이미 이 행사에 같은 번호가 등록돼 있어요." };
    if (!res.ok) return { ok: false, message: "수정에 실패했어요." };
    reload();
    return { ok: true };
  }

  async function cancelCheckIn(participantId: string) {
    setActionError(null);
    const res = await fetch(`/api/staff/participants/${participantId}/check-in/cancel`, {
      method: "POST",
    });
    if (!res.ok) {
      setActionError("입장 취소에 실패했어요.");
      return;
    }
    reload();
  }

  async function removeParticipant(participantId: string) {
    setActionError(null);
    const res = await fetch(`/api/staff/participants/${participantId}`, { method: "DELETE" });
    if (!res.ok) {
      setActionError("삭제에 실패했어요.");
      return;
    }
    reload();
  }

  return { state, actionError, updateParticipant, cancelCheckIn, removeParticipant };
}
