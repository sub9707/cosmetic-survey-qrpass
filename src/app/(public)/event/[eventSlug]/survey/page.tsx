import { notFound } from "next/navigation";
import { PageContainer } from "@/components/customer/page-container";
import { SurveyFlow } from "@/components/customer/survey-flow";
import { getEventBySlug } from "@/lib/events";

export default async function EventSurveyPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  const event = await getEventBySlug(eventSlug);
  if (!event) notFound();

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
