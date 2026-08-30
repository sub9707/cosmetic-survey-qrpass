import { Navigate, useParams } from "react-router-dom";
import { QrScannerView } from "@/components/staff/qr-scanner-view";
import { useStaffEvent } from "@/client/hooks/use-staff-event";
import { ROUTES } from "@/lib/constants";

export default function StaffScannerPage() {
  const { eventId = "" } = useParams();
  const state = useStaffEvent(eventId);

  if (state.status === "loading") return null;
  if (state.status === "unauthorized") {
    return (
      <Navigate
        to={`${ROUTES.staffLogin}?next=${encodeURIComponent(ROUTES.staffScanner(eventId))}`}
        replace
      />
    );
  }
  if (state.status === "not-found") return <Navigate to="/not-found" replace />;

  const { event, todayCount } = state;
  return <QrScannerView eventId={event.id} eventName={event.name} initialTodayCount={todayCount} />;
}
