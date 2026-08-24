import Link from "next/link";
import { notFound } from "next/navigation";
import { EventCtaButton } from "@/components/customer/event-cta-button";
import { EventLogo } from "@/components/customer/event-logo";
import { PageContainer } from "@/components/customer/page-container";
import { ROUTES } from "@/lib/constants";
import { getEventBySlug } from "@/lib/events";

export default async function EventLandingPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  const event = await getEventBySlug(eventSlug);
  if (!event) notFound();

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col items-center justify-center gap-16">
        <EventLogo name={event.name} logo={event.logo} />
        <div className="flex w-full flex-col items-center gap-3">
          <EventCtaButton href={ROUTES.eventSurvey(event.slug)}>설문조사 시작하기</EventCtaButton>
          <Link href={ROUTES.staffLogin} className="text-xs text-muted-foreground hover:underline">
            스태프 페이지
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
