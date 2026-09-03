import { useEffect, useState } from "react";
import { QrScannerView } from "@/components/staff/qr-scanner-view";
import { useAdminEvent } from "@/client/hooks/use-admin-event";
import { ROUTES } from "@/lib/constants";

export default function AdminScanPage() {
  const { event } = useAdminEvent();
  const [todayCount, setTodayCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/staff/events/${encodeURIComponent(event.id)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setTodayCount(data?.todayCount ?? 0);
      })
      .catch(() => {
        if (!cancelled) setTodayCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [event.id]);

  if (todayCount === null) return null;

  return (
    <QrScannerView
      eventId={event.id}
      eventName={event.name}
      initialTodayCount={todayCount}
      exitTo={ROUTES.adminEvent(event.id)}
    />
  );
}
