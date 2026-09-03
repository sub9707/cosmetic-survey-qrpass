import { QrScannerView } from "@/components/staff/qr-scanner-view";
import { useStaffEventCtx } from "@/client/hooks/use-staff-event-ctx";
import { ROUTES } from "@/lib/constants";

export default function StaffScannerPage() {
  const { event, todayCount } = useStaffEventCtx();
  return (
    <QrScannerView
      eventId={event.id}
      eventName={event.name}
      initialTodayCount={todayCount}
      exitTo={ROUTES.staffEvent(event.id)}
    />
  );
}
