import { notFound, redirect } from "next/navigation";
import { QrScannerView } from "@/components/staff/qr-scanner-view";
import { getStaffSession } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants";
import { getParticipantRepository, getStaffRepository } from "@/lib/db/provider";

export default async function StaffScannerPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const session = await getStaffSession();
  if (!session) redirect(ROUTES.staffLogin);

  const staffRepository = await getStaffRepository();
  const assignedEvents = await staffRepository.listAssignedEvents(session.staffId);
  const event = assignedEvents.find((e) => e.id === eventId);
  if (!event) notFound();

  const participantRepository = await getParticipantRepository();
  const todayCount = await participantRepository.countCheckedInToday(eventId);

  return <QrScannerView eventId={event.id} eventName={event.name} initialTodayCount={todayCount} />;
}
