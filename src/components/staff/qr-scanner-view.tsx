import { X } from "lucide-react";
import QrScanner from "qr-scanner";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES, type CheckInStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** 결과 토스트 노출 시간 */
const TOAST_MS = 2500;
/** 스캔 직후 같은 프레임이 연속 처리되지 않도록 잠깐 멈추는 시간 */
const RESCAN_COOLDOWN_MS = 1200;
/** 같은 토큰을 다시 무시하는 시간 (문 앞에서 QR을 계속 들고 있는 경우) */
const SAME_TOKEN_MUTE_MS = 5000;

interface CheckInResponse {
  success: boolean;
  status: CheckInStatus | "NETWORK_ERROR";
  customerNo?: string;
  participant?: { name: string };
  checkedInAt?: string;
}

type Tone = "success" | "warn" | "error";
interface Toast {
  tone: Tone;
  text: string;
}

function toastFromResponse(data: CheckInResponse): Toast {
  const tag = data.customerNo ? `고객번호[${data.customerNo}] ` : "";
  switch (data.status) {
    case "CHECKED_IN":
      return { tone: "success", text: `${tag}입장 처리가 완료되었습니다` };
    case "ALREADY_CHECKED_IN":
      return { tone: "warn", text: `${tag}이미 입장 처리된 고객입니다` };
    case "WRONG_EVENT":
      return { tone: "error", text: "다른 행사의 QR입니다" };
    case "INVALID_QR":
      return { tone: "error", text: "유효하지 않은 QR입니다" };
    case "EXPIRED_QR":
      return { tone: "error", text: "만료된 QR입니다" };
    default:
      return { tone: "error", text: "오류가 발생했어요. 다시 시도해주세요" };
  }
}

export function QrScannerView({
  eventId,
  eventName,
  initialTodayCount,
}: {
  eventId: string;
  eventName: string;
  initialTodayCount: number;
}) {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const busyRef = useRef(false);
  const lastTokenRef = useRef<{ token: string; at: number } | null>(null);
  const toastTimerRef = useRef<number | undefined>(undefined);

  const [cameraDenied, setCameraDenied] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [todayCount, setTodayCount] = useState(initialTodayCount);

  const handleScan = useCallback(
    async (token: string) => {
      if (busyRef.current) return;
      const prev = lastTokenRef.current;
      if (prev && prev.token === token && Date.now() - prev.at < SAME_TOKEN_MUTE_MS) return;

      busyRef.current = true;
      lastTokenRef.current = { token, at: Date.now() };
      scannerRef.current?.pause();

      let data: CheckInResponse;
      try {
        const res = await fetch("/api/check-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, eventId }),
        });
        data = (await res.json()) as CheckInResponse;
      } catch {
        data = { success: false, status: "NETWORK_ERROR" };
      }

      if (data.status === "UNAUTHORIZED") {
        navigate(ROUTES.staffLogin);
        return;
      }

      if (data.status === "CHECKED_IN") setTodayCount((c) => c + 1);

      setToast(toastFromResponse(data));
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = window.setTimeout(() => setToast(null), TOAST_MS);

      // 결과를 잠깐 보여준 뒤 곧바로 다음 QR을 찍을 수 있는 상태로 되돌린다.
      window.setTimeout(() => {
        busyRef.current = false;
        scannerRef.current?.start().catch(() => setCameraDenied(true));
      }, RESCAN_COOLDOWN_MS);
    },
    [eventId, navigate],
  );

  // 카메라 페이지 진입 시 모바일 전체화면을 최대한 강제한다 (브라우저 제약상 완전 강제는 불가).
  useEffect(() => {
    const el = document.documentElement;
    const enter = () => void el.requestFullscreen?.().catch(() => {});
    enter();
    const onGesture = () => {
      enter();
      window.removeEventListener("pointerdown", onGesture);
    };
    window.addEventListener("pointerdown", onGesture);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("pointerdown", onGesture);
      document.body.style.overflow = prevOverflow;
      if (document.fullscreenElement) void document.exitFullscreen?.().catch(() => {});
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const scanner = new QrScanner(video, (result) => void handleScan(result.data), {
      highlightScanRegion: false,
      highlightCodeOutline: false,
    });
    scannerRef.current = scanner;
    scanner.start().catch(() => setCameraDenied(true));

    return () => {
      scanner.stop();
      scanner.destroy();
      scannerRef.current = null;
      window.clearTimeout(toastTimerRef.current);
    };
  }, [handleScan]);

  const handleClose = () => {
    scannerRef.current?.stop();
    if (document.fullscreenElement) void document.exitFullscreen?.().catch(() => {});
    navigate(ROUTES.staffEvent(eventId));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overscroll-none bg-black text-white"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* 상단: 결과 알림 메시지 + 오늘 입장 카운트 + 카메라 종료 */}
      <div className="relative flex items-center justify-between px-4 py-4">
        <div className="min-w-0">
          <p className="truncate text-xs text-white/60">{eventName}</p>
          <p className="text-2xl font-bold tabular-nums">
            오늘 입장 {todayCount}
          </p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="flex shrink-0 items-center gap-1 rounded-full bg-white/15 px-3 py-2 text-sm font-medium backdrop-blur active:bg-white/25"
        >
          <X className="size-4" />
          카메라 종료
        </button>
      </div>

      {toast && (
        <div className="px-4">
          <div
            className={cn(
              "rounded-xl px-4 py-3 text-center text-sm font-bold shadow-lg",
              toast.tone === "success" && "bg-emerald-500 text-white",
              toast.tone === "warn" && "bg-amber-400 text-black",
              toast.tone === "error" && "bg-red-500 text-white",
            )}
          >
            {toast.text}
          </div>
        </div>
      )}

      <div className="relative mx-4 my-4 flex flex-1 items-center justify-center overflow-hidden rounded-2xl bg-neutral-900">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />

        {/* 고정 뷰파인더: 흔들리지 않는 정적 사각형 가이드 */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="aspect-square w-2/3 max-w-64 rounded-2xl border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
        </div>

        {cameraDenied && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/90 px-6 text-center">
            <p className="font-bold">카메라 권한이 필요해요</p>
            <p className="text-sm text-white/70">브라우저 설정에서 카메라 접근을 허용해주세요.</p>
          </div>
        )}
      </div>

      <p className="pb-3 text-center text-xs text-white/50">QR을 사각형 안에 맞추면 자동으로 인식돼요</p>
    </div>
  );
}
