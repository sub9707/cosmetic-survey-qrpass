import { Navigate, useParams } from "react-router-dom";
import { CompleteForm } from "@/components/customer/complete-form";
import { PageContainer } from "@/components/customer/page-container";
import { useEvent } from "@/client/hooks/use-event";

export default function EventCompletePage() {
  const { eventSlug = "" } = useParams();
  const state = useEvent(eventSlug);

  if (state.status === "loading") return null;
  if (state.status === "not-found") return <Navigate to="/not-found" replace />;

  const { event, dailyCapacity } = state;
  return (
    <PageContainer>
      <CompleteForm
        eventSlug={event.slug}
        eventName={event.name}
        eventLogo={event.logo}
        copy={event.copy}
        questionIds={event.questions.map((q) => q.id)}
        initiallyFull={dailyCapacity.isFull}
      />
    </PageContainer>
  );
}
