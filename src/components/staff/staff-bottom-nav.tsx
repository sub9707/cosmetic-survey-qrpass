import { ClipboardList, QrCode } from "lucide-react";
import { NavLink } from "react-router-dom";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** 스태프 셸 하단 탭 (입장명단 / 스캔). */
export function StaffBottomNav({ eventId }: { eventId: string }) {
  const items = [
    { to: ROUTES.staffEvent(eventId), label: "입장명단", icon: ClipboardList, end: true },
    { to: ROUTES.staffEventScan(eventId), label: "스캔", icon: QrCode, end: false },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t bg-background">
      <ul className="grid grid-cols-2">
        {items.map(({ to, label, icon: Icon, end }) => (
          <li key={label}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
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
