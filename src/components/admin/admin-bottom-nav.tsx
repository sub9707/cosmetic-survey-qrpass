import { BarChart3, CalendarDays, DoorOpen, QrCode, Users } from "lucide-react";
import { NavLink } from "react-router-dom";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** 관리자 대시보드 하단 탭 네비게이션 (모바일 우선). */
export function AdminBottomNav({ eventId }: { eventId: string }) {
  const items = [
    { to: ROUTES.adminEvent(eventId), label: "통계", icon: BarChart3, end: true },
    { to: ROUTES.adminEventDaily(eventId), label: "일자별", icon: CalendarDays, end: false },
    { to: ROUTES.adminEventParticipants(eventId), label: "참여자", icon: Users, end: false },
    { to: ROUTES.adminEventCheckIns(eventId), label: "입장관리", icon: DoorOpen, end: false },
    { to: ROUTES.adminEventScan(eventId), label: "스캔", icon: QrCode, end: false },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t bg-background">
      <ul className="grid grid-cols-5">
        {items.map(({ to, label, icon: Icon, end }) => (
          <li key={label}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )
              }
            >
              <Icon className="size-5" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
