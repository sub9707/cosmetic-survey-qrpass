import { Navigate, useParams } from "react-router-dom";
import { AdminParticipantCard } from "@/components/admin/admin-participant-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminParticipants } from "@/client/hooks/use-admin-participants";
import { ROUTES } from "@/lib/constants";

export default function AdminDashboardPage() {
  const { eventId = "" } = useParams();
  const { date, setDate, state, actionError, checkIn, cancelCheckIn, removeParticipant } =
    useAdminParticipants(eventId);

  if (state.status === "loading") return null;
  if (state.status === "unauthorized") {
    return (
      <Navigate to={`${ROUTES.adminLogin}?next=${encodeURIComponent(ROUTES.adminEvent(eventId))}`} replace />
    );
  }
  if (state.status === "not-found") return <Navigate to="/not-found" replace />;

  const { event, participants } = state;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 py-6">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{event.name}</p>
        <h1 className="text-lg font-bold">참가자 관리</h1>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="admin-date">날짜</Label>
        <Input id="admin-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {actionError && <p className="text-sm text-destructive">{actionError}</p>}

      <p className="text-sm text-muted-foreground">{participants.length}명</p>

      {participants.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">해당 날짜에 등록된 참가자가 없어요.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {participants.map((participant) => (
            <AdminParticipantCard
              key={participant.id}
              participant={participant}
              onCheckIn={() => checkIn(participant.id)}
              onCancelCheckIn={() => cancelCheckIn(participant.id)}
              onRemove={() => {
                if (window.confirm(`${participant.name} 참가자를 삭제할까요? 되돌릴 수 없어요.`)) {
                  removeParticipant(participant.id);
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
