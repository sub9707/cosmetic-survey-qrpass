import { AlertTriangle, CheckCircle2, WifiOff, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CheckInStatus } from "@/lib/constants";

interface CheckInResultBannerProps {
  status: CheckInStatus | "NETWORK_ERROR";
  participantName?: string;
  checkedInAt?: string;
}

const STATUS_TEXT: Record<string, string> = {
  CHECKED_IN: "입장 완료",
  ALREADY_CHECKED_IN: "이미 입장 처리됨",
  INVALID_QR: "유효하지 않은 QR",
  WRONG_EVENT: "다른 행사 QR입니다",
  EXPIRED_QR: "만료된 QR입니다",
  UNAUTHORIZED: "로그인이 만료됐어요",
  SERVER_ERROR: "서버 오류, 다시 시도해주세요",
  NETWORK_ERROR: "네트워크 오류, 다시 시도해주세요",
};

/** draft.md §31 — 실패 원인을 뭉뚱그리지 않고 상태별로 다르게 보여준다. */
export function CheckInResultBanner({ status, participantName, checkedInAt }: CheckInResultBannerProps) {
  const isSuccess = status === "CHECKED_IN";
  const isWarning = status === "ALREADY_CHECKED_IN";

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-2xl px-6 py-8 text-center",
        isSuccess && "bg-emerald-50 text-emerald-700",
        isWarning && "bg-amber-50 text-amber-700",
        !isSuccess && !isWarning && "bg-red-50 text-red-700",
      )}
    >
      {isSuccess && <CheckCircle2 className="size-12" />}
      {isWarning && <AlertTriangle className="size-12" />}
      {!isSuccess && !isWarning && status === "SERVER_ERROR" && <WifiOff className="size-12" />}
      {!isSuccess && !isWarning && status !== "SERVER_ERROR" && <XCircle className="size-12" />}

      <p className="text-lg font-bold">{STATUS_TEXT[status] ?? status}</p>
      {participantName && <p className="text-base font-medium">{participantName}</p>}
      {checkedInAt && (
        <p className="text-sm opacity-80">{new Date(checkedInAt).toLocaleTimeString("ko-KR")}</p>
      )}
    </div>
  );
}
