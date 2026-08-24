import Link from "next/link";
import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants";
import { getStaffRepository } from "@/lib/db/provider";

export default async function StaffHomePage() {
  const session = await getStaffSession();
  if (!session) redirect(ROUTES.staffLogin);

  const staffRepository = await getStaffRepository();
  const events = await staffRepository.listAssignedEvents(session.staffId);

  if (events.length === 0) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4 text-center">
        <p className="text-sm text-muted-foreground">배정된 행사가 없습니다. 관리자에게 문의해주세요.</p>
      </div>
    );
  }

  if (events.length === 1) {
    redirect(ROUTES.staffEvent(events[0].id));
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-3 px-4">
      <h1 className="mb-2 text-lg font-bold">담당 행사를 선택해주세요</h1>
      {events.map((event) => (
        <Link
          key={event.id}
          href={ROUTES.staffEvent(event.id)}
          className="rounded-lg border px-4 py-3 font-medium hover:bg-muted"
        >
          {event.name}
        </Link>
      ))}
    </div>
  );
}
