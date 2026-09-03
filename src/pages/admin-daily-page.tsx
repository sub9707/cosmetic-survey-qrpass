import { Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminEvent } from "@/client/hooks/use-admin-event";
import { useAdminDaily } from "@/client/hooks/use-admin-daily";
import { cn } from "@/lib/utils";

function rate(part: number, total: number): string {
  return total > 0 ? `${((part / total) * 100).toFixed(1)}%` : "-";
}

export default function AdminDailyPage() {
  const { event } = useAdminEvent();
  const state = useAdminDaily(event.id);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold">일자별 참여 인원</h2>
        <a
          href={`/api/admin/events/${encodeURIComponent(event.id)}/daily.csv`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}
        >
          <Download />
          엑셀 다운로드
        </a>
      </div>

      {state.status === "loading" && (
        <p className="py-10 text-center text-sm text-muted-foreground">불러오는 중…</p>
      )}
      {state.status === "error" && (
        <p className="py-10 text-center text-sm text-destructive">불러오지 못했어요.</p>
      )}
      {state.status === "ready" &&
        (state.daily.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">아직 참여 기록이 없어요.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>날짜</TableHead>
                <TableHead className="text-right">등록</TableHead>
                <TableHead className="text-right">입장</TableHead>
                <TableHead className="text-right">입장률</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.daily.map((d) => (
                <TableRow key={d.date}>
                  <TableCell className="tabular-nums">{d.date}</TableCell>
                  <TableCell className="text-right tabular-nums">{d.registered}</TableCell>
                  <TableCell className="text-right tabular-nums">{d.checkedIn}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {rate(d.checkedIn, d.registered)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell>합계</TableCell>
                <TableCell className="text-right tabular-nums">
                  {state.daily.reduce((s, d) => s + d.registered, 0)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {state.daily.reduce((s, d) => s + d.checkedIn, 0)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {rate(
                    state.daily.reduce((s, d) => s + d.checkedIn, 0),
                    state.daily.reduce((s, d) => s + d.registered, 0),
                  )}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        ))}
    </div>
  );
}
