import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminParticipantEditDialog } from "@/components/admin/admin-participant-edit-dialog";
import { useStaffEventCtx } from "@/client/hooks/use-staff-event-ctx";
import { useStaffRoster } from "@/client/hooks/use-staff-roster";
import type { AdminParticipantSummary } from "@/types/participant";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

export default function StaffRosterPage() {
  const { event } = useStaffEventCtx();
  const { state, actionError, updateParticipant, cancelCheckIn, removeParticipant } =
    useStaffRoster(event.id);
  const [editing, setEditing] = useState<AdminParticipantSummary | null>(null);

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold">오늘 입장 명단</h2>
      {actionError && <p className="text-sm text-destructive">{actionError}</p>}

      {state.status === "loading" && (
        <p className="py-10 text-center text-sm text-muted-foreground">불러오는 중…</p>
      )}
      {state.status === "error" && (
        <p className="py-10 text-center text-sm text-destructive">불러오지 못했어요.</p>
      )}
      {state.status === "ready" &&
        (state.participants.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            아직 입장한 참가자가 없어요.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{state.participants.length}명 입장</p>
            <div className="flex flex-col gap-2">
              {state.participants.map((p) => (
                <div key={p.id} className="flex flex-col gap-2 rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.name}</p>
                      <p className="truncate text-sm text-muted-foreground">{p.phone}</p>
                    </div>
                    <Badge variant="default" className="shrink-0">
                      입장 {p.checkedInAt ? formatTime(p.checkedInAt) : "-"}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setEditing(p)}
                    >
                      수정
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        if (window.confirm(`${p.name} 참가자의 입장을 취소할까요?`)) {
                          cancelCheckIn(p.id);
                        }
                      }}
                    >
                      입장 취소
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (window.confirm(`${p.name} 참가자를 삭제할까요? 되돌릴 수 없어요.`)) {
                          removeParticipant(p.id);
                        }
                      }}
                    >
                      삭제
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ))}

      <AdminParticipantEditDialog
        participant={editing}
        onClose={() => setEditing(null)}
        onSubmit={updateParticipant}
      />
    </div>
  );
}
