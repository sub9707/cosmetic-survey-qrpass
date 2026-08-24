"use client";

import QrScanner from "qr-scanner";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckInResultBanner } from "@/components/staff/check-in-result-banner";
import { ROUTES, type CheckInStatus } from "@/lib/constants";

const RESULT_DISPLAY_MS = 2000;

interface CheckInResponse {
  success: boolean;
  status: CheckInStatus | "NETWORK_ERROR";
  participant?: { name: string };
  checkedInAt?: string;
}

type ScanState = { kind: "scanning" } | { kind: "camera-denied" } | { kind: "result"; data: CheckInResponse };

export function QrScannerView({
  eventId,
  eventName,
  initialTodayCount,
}: {
  eventId: string;
  eventName: string;
  initialTodayCount: number;
}) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const busyRef = useRef(false);

  const [state, setState] = useState<ScanState>({ kind: "scanning" });
  const [todayCount, setTodayCount] = useState(initialTodayCount);

  const handleScan = useCallback(
    async (token: string) => {
      if (busyRef.current) return;
      busyRef.current = true;
      scannerRef.current?.pause();

      let data: CheckInResponse;
      try {
        const res = await fetch("/api/check-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, eventId }),
        });
        data = await res.json();
      } catch {
        data = { success: false, status: "NETWORK_ERROR" };
      }

      if (data.status === "CHECKED_IN") {
        setTodayCount((c) => c + 1);
      }
      setState({ kind: "result", data });

      if (data.status === "UNAUTHORIZED") {
        router.push(ROUTES.staffLogin);
        return;
      }

      setTimeout(() => {
        busyRef.current = false;
        setState({ kind: "scanning" });
        scannerRef.current?.start();
      }, RESULT_DISPLAY_MS);
    },
    [eventId, router],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // qr-scanner 기본 하이라이트(노란 실시간 외곽선)는 인식된 QR 모양을 프레임마다
    // 다시 그려서 계속 일렁여 보인다. 대신 아래에 우리가 그린 고정된 뷰파인더 사각형을 쓴다.
    const scanner = new QrScanner(video, (result) => void handleScan(result.data), {
      highlightScanRegion: false,
      highlightCodeOutline: false,
    });
    scannerRef.current = scanner;
    scanner.start().catch(() => setState({ kind: "camera-denied" }));

    return () => {
      scanner.stop();
      scanner.destroy();
      scannerRef.current = null;
    };
  }, [handleScan]);

  return (
    <div
      className="flex min-h-dvh flex-col bg-black text-white"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex flex-col items-center gap-1 py-6">
        <p className="text-sm text-white/70">{eventName} · 오늘 입장</p>
        <p className="text-5xl font-bold tabular-nums">{todayCount}</p>
      </div>

      <div className="relative mx-6 mb-6 flex flex-1 items-center justify-center overflow-hidden rounded-2xl bg-neutral-900">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />

        {/* 고정 뷰파인더: 흔들리지 않는 정적 사각형 가이드 */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="aspect-square w-2/3 max-w-64 rounded-2xl border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
        </div>

        {state.kind === "camera-denied" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/90 px-6 text-center">
            <p className="font-bold">카메라 권한이 필요해요</p>
            <p className="text-sm text-white/70">브라우저 설정에서 카메라 접근을 허용해주세요.</p>
          </div>
        )}

        {state.kind === "result" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 px-6">
            <CheckInResultBanner
              status={state.data.status}
              participantName={state.data.participant?.name}
              checkedInAt={state.data.checkedInAt}
            />
          </div>
        )}
      </div>
    </div>
  );
}
