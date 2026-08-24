import { notFound } from "next/navigation";
import { CompleteForm } from "@/components/customer/complete-form";
import { PageContainer } from "@/components/customer/page-container";
import { getEventBySlug } from "@/lib/events";

export default async function EventCompletePage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  const event = await getEventBySlug(eventSlug);
  if (!event) notFound();

  return (
    <PageContainer>
      <CompleteForm
        eventSlug={event.slug}
        eventName={event.name}
        eventLogo={event.logo}
        copy={event.copy}
        questionIds={event.questions.map((q) => q.id)}
      />
    </PageContainer>
  );
}
