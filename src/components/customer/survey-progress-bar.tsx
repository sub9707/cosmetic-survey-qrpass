import { cn } from "@/lib/utils";

/** 현재 몇 번째 문항인지 가로 블록으로 표시 (0-indexed current). */
export function SurveyProgressBar({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex gap-1.5" role="progressbar" aria-valuenow={current + 1} aria-valuemax={total}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 flex-1 rounded-full transition-colors",
            i <= current ? "bg-event-primary" : "bg-event-primary-soft",
          )}
        />
      ))}
    </div>
  );
}
