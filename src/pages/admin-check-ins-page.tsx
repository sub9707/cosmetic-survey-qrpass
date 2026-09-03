import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminCheckInTimeDialog } from "@/components/admin/admin-check-in-time-dialog";
import { useAdminEvent } from "@/client/hooks/use-admin-event";
import { useAdminParticipants } from "@/client/hooks/use-admin-participants";
import type { AdminParticipantSummary } from "@/types/participant";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

export default function AdminCheckInsPage() {
  const { event } = useAdminEvent();
  const { date, setDate, state, actionError, checkIn, cancelCheckIn, updateCheckInTime } =
    useAdminParticipants(event.id);
  const [editing, setEditing] = useState<AdminParticipantSummary | null>(null);

  const participants = state.status === "ready" ? state.participants : [];
  const checkedInCount = participants.filter((p) => p.checkedInAt).length;

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold">입장 처리 관리</h2>

      <div className="space-y-1.5">
        <Label htmlFor="check-in-date">날짜</Label>
        <Input
          id="check-in-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {actionError && <p className="text-sm text-destructive">{actionError}</p>}

      {state.status !== "ready" ? (
        <p className="py-10 text-center text-sm text-muted-foreground">불러오는 중…</p>
      ) : participants.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          해당 날짜에 등록된 참여자가 없어요.
        </p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {participants.length}명 중 <span className="font-medium text-foreground">{checkedInCount}명</span> 입장
          </p>
          <div className="flex flex-col gap-2">
            {participants.map((p) => {
              const isCheckedIn = Boolean(p.checkedInAt);
              return (
                <div key={p.id} className="flex flex-col gap-2 rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-sm text-muted-foreground">{p.phone}</p>
                    </div>
                    <Badge variant={isCheckedIn ? "default" : "outline"}>
                      {isCheckedIn ? `입장 ${formatTime(p.checkedInAt!)}` : "미입장"}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    {isCheckedIn ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setEditing(p)}
                        >
                          시각 수정
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => cancelCheckIn(p.id)}
                        >
                          입장 취소
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={() => checkIn(p.id)}
                      >
                        입장 확인
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <AdminCheckInTimeDialog
        participant={editing}
        onClose={() => setEditing(null)}
        onSubmit={updateCheckInTime}
      />
    </div>
  );
}
