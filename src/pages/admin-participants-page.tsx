import { useState } from "react";
import { AdminParticipantCard } from "@/components/admin/admin-participant-card";
import { AdminParticipantEditDialog } from "@/components/admin/admin-participant-edit-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminEvent } from "@/client/hooks/use-admin-event";
import { useAdminParticipants } from "@/client/hooks/use-admin-participants";
import type { AdminParticipantSummary } from "@/types/participant";

export default function AdminParticipantsPage() {
  const { event } = useAdminEvent();
  const { date, setDate, state, actionError, removeParticipant, updateParticipant } =
    useAdminParticipants(event.id);
  const [editing, setEditing] = useState<AdminParticipantSummary | null>(null);

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold">참여자 관리</h2>

      <div className="space-y-1.5">
        <Label htmlFor="admin-date">날짜</Label>
        <Input id="admin-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {actionError && <p className="text-sm text-destructive">{actionError}</p>}

      {state.status !== "ready" ? (
        <p className="py-10 text-center text-sm text-muted-foreground">불러오는 중…</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{state.participants.length}명</p>
          {state.participants.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              해당 날짜에 등록된 참여자가 없어요.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {state.participants.map((participant) => (
                <AdminParticipantCard
                  key={participant.id}
                  participant={participant}
                  onEdit={() => setEditing(participant)}
                  onRemove={() => {
                    if (
                      window.confirm(`${participant.name} 참여자를 삭제할까요? 되돌릴 수 없어요.`)
                    ) {
                      removeParticipant(participant.id);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}

      <AdminParticipantEditDialog
        participant={editing}
        onClose={() => setEditing(null)}
        onSubmit={updateParticipant}
      />
    </div>
  );
}
