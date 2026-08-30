import { Navigate, useParams } from "react-router-dom";
import { PageContainer } from "@/components/customer/page-container";
import { SurveyFlow } from "@/components/customer/survey-flow";
import { useEvent } from "@/client/hooks/use-event";
import { ROUTES } from "@/lib/constants";

export default function EventSurveyPage() {
  const { eventSlug = "" } = useParams();
  const state = useEvent(eventSlug);

  if (state.status === "loading") return null;
  if (state.status === "not-found") return <Navigate to="/not-found" replace />;

  const { event, dailyCapacity } = state;
  // 오늘 정원이 이미 찬 상태로 설문 페이지에 직접 들어오는 걸 막는다 — 마지막 방어선은
  // 항상 POST /api/participants(정원 원자적 재확인)지만, 여기서도 미리 랜딩으로 돌려보낸다.
  if (dailyCapacity.isFull) return <Navigate to={ROUTES.event(event.slug)} replace />;

  return (
    <PageContainer>
      <SurveyFlow
        eventSlug={event.slug}
        eventName={event.name}
        eventLogo={event.logo}
        questions={event.questions}
      />
    </PageContainer>
  );
}
