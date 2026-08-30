import { Link, Navigate, useParams } from "react-router-dom";
import { useStaffEvent } from "@/client/hooks/use-staff-event";
import { ROUTES } from "@/lib/constants";

export default function StaffEventPage() {
  const { eventId = "" } = useParams();
  const state = useStaffEvent(eventId);

  if (state.status === "loading") return null;
  if (state.status === "unauthorized") {
    return (
      <Navigate to={`${ROUTES.staffLogin}?next=${encodeURIComponent(ROUTES.staffEvent(eventId))}`} replace />
    );
  }
  if (state.status === "not-found") return <Navigate to="/not-found" replace />;

  const { event, todayCount } = state;
  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-10 px-4 text-center">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{event.name}</p>
        <p className="text-6xl font-bold tabular-nums">{todayCount}</p>
        <p className="text-sm text-muted-foreground">오늘 입장</p>
      </div>
      <Link
        to={ROUTES.staffScanner(event.id)}
        className="w-full rounded-lg bg-primary px-6 py-4 text-center text-base font-bold text-primary-foreground hover:bg-primary/90"
      >
        QR 스캔 시작
      </Link>
    </div>
  );
}
