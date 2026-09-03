import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { CompleteSuccessView } from "@/components/customer/complete-success-view";
import { PageContainer } from "@/components/customer/page-container";
import { useEvent } from "@/client/hooks/use-event";

type PassState =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "ready"; checkedIn: boolean; qrImageUrl: string | null; customerNo: string | null };

/**
 * 입장용 QR 확인 페이지. 설문 제출 후(개발/모의 단계) 이 URL로 바로 이동하며,
 * 새로고침·재방문으로도 QR과 현재 입장 상태를 다시 볼 수 있다.
 */
export default function EventPassPage() {
  const { eventSlug = "", participantId = "" } = useParams();
  const eventState = useEvent(eventSlug);
  const [pass, setPass] = useState<PassState>({ status: "loading" });

  useEffect(() => {
    if (!participantId) return;
    let cancelled = false;

    fetch(`/api/participants/${encodeURIComponent(participantId)}/status`)
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          setPass({ status: "not-found" });
          return;
        }
        const data = (await res.json()) as {
          checkedIn?: boolean;
          qrImageUrl?: string | null;
          customerNo?: string | null;
        };
        setPass({
          status: "ready",
          checkedIn: Boolean(data.checkedIn),
          qrImageUrl: data.qrImageUrl ?? null,
          customerNo: data.customerNo ?? null,
        });
      })
      .catch(() => {
        if (!cancelled) setPass({ status: "not-found" });
      });

    return () => {
      cancelled = true;
    };
  }, [participantId]);

  if (eventState.status === "loading" || pass.status === "loading") return null;
  if (eventState.status === "not-found" || pass.status === "not-found") {
    return <Navigate to="/not-found" replace />;
  }

  return (
    <PageContainer>
      <CompleteSuccessView
        eventName={eventState.event.name}
        eventLogo={eventState.event.logo}
        qrImageUrl={pass.qrImageUrl}
        participantId={participantId}
        customerNo={pass.customerNo}
        initialCheckedIn={pass.checkedIn}
      />
    </PageContainer>
  );
}
