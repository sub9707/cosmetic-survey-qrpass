import { useAdminEvent } from "@/client/hooks/use-admin-event";
import { useAdminStats } from "@/client/hooks/use-admin-stats";
import type { AdminQuestionStat } from "@/types/admin";

function StatTile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function pct(part: number, total: number): string {
  return total > 0 ? `${((part / total) * 100).toFixed(1)}%` : "0%";
}

function QuestionStatBlock({ q }: { q: AdminQuestionStat }) {
  return (
    <div className="space-y-2 rounded-lg border p-3">
      <p className="text-sm font-medium wrap-break-word">
        {q.order}. {q.question.replace(/\n/g, " ")}
      </p>
      <p className="text-xs text-muted-foreground">응답 {q.total}건</p>
      <ul className="space-y-1.5">
        {q.choices.map((c) => (
          <li key={c.label} className="space-y-1">
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="min-w-0 flex-1 truncate">
                <span className="font-medium">{c.label}.</span> {c.text.replace(/\n/g, " ")}
              </span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {c.count} · {pct(c.count, q.total)}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded bg-muted">
              <div
                className="h-full rounded bg-primary"
                style={{ width: q.total > 0 ? `${(c.count / q.total) * 100}%` : "0%" }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AdminStatsPage() {
  const { event } = useAdminEvent();
  const state = useAdminStats(event.id);

  if (state.status === "loading") {
    return <p className="py-10 text-center text-sm text-muted-foreground">불러오는 중…</p>;
  }
  if (state.status === "error") {
    return <p className="py-10 text-center text-sm text-destructive">통계를 불러오지 못했어요.</p>;
  }

  const { stats, questions } = state;

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="text-sm font-bold">요약</h2>
        <div className="grid grid-cols-2 gap-2">
          <StatTile label="누적 참여자" value={stats.totalParticipants} />
          <StatTile
            label="누적 입장"
            value={stats.totalCheckedIn}
            sub={`입장률 ${pct(stats.totalCheckedIn, stats.totalParticipants)}`}
          />
          <StatTile label="오늘 참여" value={stats.todayParticipants} />
          <StatTile
            label="오늘 입장"
            value={stats.todayCheckedIn}
            sub={`입장률 ${pct(stats.todayCheckedIn, stats.todayParticipants)}`}
          />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-bold">알림톡 발송</h2>
        <div className="grid grid-cols-3 gap-2">
          <StatTile label="발송 완료" value={stats.notification.SENT} />
          <StatTile label="발송 대기" value={stats.notification.PENDING} />
          <StatTile label="발송 실패" value={stats.notification.FAILED} />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-bold">마케팅 수신 동의</h2>
        <StatTile
          label="동의 인원"
          value={stats.marketingAgreed}
          sub={`전체의 ${pct(stats.marketingAgreed, stats.totalParticipants)}`}
        />
      </section>

      {questions.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold">문항별 응답 분포</h2>
          <div className="space-y-2">
            {questions.map((q) => (
              <QuestionStatBlock key={q.questionId} q={q} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
