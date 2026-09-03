import { Navigate, useParams } from "react-router-dom";
import { EventCtaButton } from "@/components/customer/event-cta-button";
import { EventLogo } from "@/components/customer/event-logo";
import { PageContainer } from "@/components/customer/page-container";
import { useEvent } from "@/client/hooks/use-event";
import { ROUTES } from "@/lib/constants";

export default function EventLandingPage() {
  const { eventSlug = "" } = useParams();
  const state = useEvent(eventSlug);

  if (state.status === "loading") return null;
  if (state.status === "not-found") return <Navigate to="/not-found" replace />;

  const { event, dailyCapacity } = state;
  return (
    <PageContainer>
      <div className="flex flex-1 flex-col items-center justify-center gap-16">
        <EventLogo name={event.name} logo={event.logo} />
        <div className="flex w-full flex-col items-center gap-3">
          {dailyCapacity.isFull ? (
            <>
              <EventCtaButton href={ROUTES.eventSurvey(event.slug)} disabled>
                오늘의 선착순 마감되었습니다
              </EventCtaButton>
              <p className="text-center text-xs text-muted-foreground">
                하루 {dailyCapacity.limit}명 선착순 참여가 모두 마감되었어요. 내일 다시 만나요!
              </p>
            </>
          ) : (
            <EventCtaButton href={ROUTES.eventSurvey(event.slug)}>설문조사 시작하기</EventCtaButton>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
