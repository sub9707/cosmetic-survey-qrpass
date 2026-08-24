import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getStaffSession } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants";
import { getParticipantRepository, getStaffRepository } from "@/lib/db/provider";

export default async function StaffEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const session = await getStaffSession();
  if (!session) redirect(ROUTES.staffLogin);

  // STAFF는 담당 행사 데이터만 볼 수 있어야 한다 (draft.md §23) — 페이지에서도 재확인.
  const staffRepository = await getStaffRepository();
  const assignedEvents = await staffRepository.listAssignedEvents(session.staffId);
  const event = assignedEvents.find((e) => e.id === eventId);
  if (!event) notFound();

  const participantRepository = await getParticipantRepository();
  const todayCount = await participantRepository.countCheckedInToday(eventId);

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-10 px-4 text-center">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{event.name}</p>
        <p className="text-6xl font-bold tabular-nums">{todayCount}</p>
        <p className="text-sm text-muted-foreground">오늘 입장</p>
      </div>
      <Link
        href={ROUTES.staffScanner(event.id)}
        className="w-full rounded-lg bg-primary px-6 py-4 text-center text-base font-bold text-primary-foreground hover:bg-primary/90"
      >
        QR 스캔 시작
      </Link>
    </div>
  );
}
