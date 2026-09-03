import { useEffect, useState } from "react";
import { EventLogo } from "@/components/customer/event-logo";
import type { EventSummary } from "@/types/event";

const POLL_INTERVAL_MS = 2000;
/** 문 앞에서 QR을 보여주는 시간을 넉넉히 잡되, 방치된 탭이 무한 폴링하지 않도록 상한을 둔다. */
const POLL_MAX_MS = 10 * 60 * 1000;

interface Props {
  eventName: string;
  eventLogo?: EventSummary["logo"];
  qrImageUrl: string | null;
  participantId: string | null;
  customerNo: string | null;
  /** 페이지 진입 시점에 이미 입장 처리된 경우 (새로고침·URL 직접 접근) — 오버레이만 즉시 표시하고 alert는 띄우지 않는다. */
  initialCheckedIn?: boolean;
}

/**
 * 설문 완료 후 입장용 QR을 보여주는 화면.
 * 스태프가 이 QR을 스캔하면 서버 checked_in_at이 채워지고, 여기서 2초 간격 폴링으로
 * 그 사실을 감지해 alert + QR 위 "입장 처리된 QR 코드입니다" 오버레이를 띄운다.
 */
export function CompleteSuccessView({
  eventName,
  eventLogo,
  qrImageUrl,
  participantId,
  customerNo,
  initialCheckedIn = false,
}: Props) {
  const [checkedIn, setCheckedIn] = useState(initialCheckedIn);

  useEffect(() => {
    if (!participantId || checkedIn) return;
    let cancelled = false;
    const startedAt = Date.now();

    const id = window.setInterval(async () => {
      if (cancelled) return;
      if (Date.now() - startedAt > POLL_MAX_MS) {
        window.clearInterval(id);
        return;
      }
      try {
        const res = await fetch(`/api/participants/${encodeURIComponent(participantId)}/status`);
        if (!res.ok) return;
        const data = (await res.json()) as { checkedIn?: boolean };
        if (data.checkedIn && !cancelled) {
          window.clearInterval(id);
          setCheckedIn(true);
          window.alert("입장 처리되었습니다");
        }
      } catch {
        // 순간적인 네트워크 오류는 무시하고 다음 주기에 재시도한다.
      }
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [participantId, checkedIn]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
      <EventLogo name={eventName} logo={eventLogo} />
      <p className="text-xl font-bold text-event-primary">발송 완료!</p>
      <p className="text-sm text-muted-foreground">
        카카오톡으로 입장용 Fast Track 패스가 곧 도착해요.
      </p>

      {qrImageUrl && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-event-primary/30 p-4">
          <div className="relative">
            <img
              src={qrImageUrl}
              alt="입장용 QR"
              width={160}
              height={160}
              className={checkedIn ? "opacity-40" : undefined}
            />
            {checkedIn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 leading-tight">
                <span className="text-lg font-extrabold text-red-600">입장 처리된</span>
                <span className="text-lg font-extrabold text-red-600">QR 코드입니다</span>
              </div>
            )}
          </div>
          {customerNo && (
            <p className="text-sm font-semibold tracking-wider">고객번호 {customerNo}</p>
          )}
          <p className="text-xs text-muted-foreground">
            (모의 발송 모드 미리보기 — 실제 카카오 연동 시에는 카카오톡으로만 전달됩니다)
          </p>
        </div>
      )}
    </div>
  );
}
