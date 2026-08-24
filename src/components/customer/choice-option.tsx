import { cn } from "@/lib/utils";
import type { ChoiceLabel } from "@/lib/constants";

interface ChoiceOptionProps {
  label: ChoiceLabel;
  text: string;
  selected: boolean;
  onSelect: () => void;
}

/** 설문 4지선다 옵션 하나. 선택 시 이벤트 테마 색으로 채워진다. */
export function ChoiceOption({ label, text, selected, onSelect }: ChoiceOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        // min-h: 선택지 텍스트 길이가 문항마다 달라도 버튼 높이를 일정하게 유지해서
        // 화면 내 4개 버튼의 위치가 문항이 바뀌어도 흔들리지 않게 한다.
        "flex min-h-20 w-full items-center gap-4 rounded-xl border-2 px-4 py-4 text-left transition-colors",
        selected
          ? "border-event-primary bg-event-primary text-event-primary-foreground"
          : "border-event-primary/40 bg-background text-foreground hover:bg-event-primary-soft",
      )}
    >
      {/* 라벨: 항상 버튼 왼쪽 끝에 고정, 텍스트 길이와 무관하게 크기 일정 */}
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full text-lg font-extrabold",
          selected ? "bg-event-primary-foreground/20" : "bg-event-primary-soft text-event-primary",
        )}
      >
        {label}
      </span>
      <span className="flex-1 text-sm leading-relaxed font-medium whitespace-pre-line">{text}</span>
    </button>
  );
}
