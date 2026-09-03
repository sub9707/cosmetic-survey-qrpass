import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CompleteSuccessView } from "@/components/customer/complete-success-view";
import { EventCtaButton } from "@/components/customer/event-cta-button";
import { EventLogo } from "@/components/customer/event-logo";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/lib/constants";
import { formatPhone } from "@/lib/utils/phone";
import {
  clearSurveyAnswers,
  hasCompleteSurveyAnswers,
  loadSurveyAnswers,
} from "@/lib/utils/survey-storage";
import { participantFormSchema, type ParticipantFormInput } from "@/lib/validation/participant";
import type { EventCopy, EventSummary } from "@/types/event";

interface CompleteFormProps {
  eventSlug: string;
  eventName: string;
  eventLogo?: EventSummary["logo"];
  copy?: Partial<EventCopy>;
  /** 이 행사 문항 id 목록. 저장된 답변이 이 문항들을 전부 채웠는지 확인하는 데 쓴다. */
  questionIds: string[];
  /**
   * 이 페이지가 열린 시점에 이미 하루 정원이 마감됐는지 (survey 페이지 진입 이후
   * 동시에 여러 명이 마지막 자리를 두고 경쟁하는 경우를 대비한 2차 필터링 — draft.md §10).
   * 최종 확정은 항상 제출 시 서버(POST /api/participants)의 원자적 재확인이다.
   */
  initiallyFull: boolean;
}

type ViewState =
  | { kind: "form" }
  | { kind: "full" }
  | {
      kind: "success";
      qrImageUrl: string | null;
      participantId: string | null;
      customerNo: string | null;
    };

export function CompleteForm({
  eventSlug,
  eventName,
  eventLogo,
  copy,
  questionIds,
  initiallyFull,
}: CompleteFormProps) {
  const navigate = useNavigate();
  const resultHeadline = copy?.resultHeadline ?? "설문이 완료되었어요!";
  const resultSubline = copy?.resultSubline ?? "입장권을 받기 위해 아래 정보를 입력해주세요.";
  const privacyConsentLabel = copy?.privacyConsentLabel ?? "[필수] 개인정보 수집 및 이용 동의";
  const marketingConsentLabel = copy?.marketingConsentLabel ?? "[선택] 마케팅 정보 수신 동의";

  const [view, setView] = useState<ViewState>(initiallyFull ? { kind: "full" } : { kind: "form" });
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 설문을 다 안 채우고 이 페이지에 직접 접근했거나(URL 직접 입력, 새로고침, 뒤로가기 등)
  // 답변이 유실/불완전한 경우 처음 페이지로 돌려보낸다.
  useEffect(() => {
    if (!hasCompleteSurveyAnswers(eventSlug, questionIds)) {
      toast.error("설문을 먼저 진행해주세요.");
      navigate(ROUTES.event(eventSlug), { replace: true });
    }
  }, [eventSlug, questionIds, navigate]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ParticipantFormInput>({
    resolver: zodResolver(participantFormSchema),
    defaultValues: { name: "", phone: "", privacyAgreed: false, marketingAgreed: false },
  });

  async function onSubmit(values: ParticipantFormInput) {
    setSubmitError(null);
    if (!hasCompleteSurveyAnswers(eventSlug, questionIds)) {
      setSubmitError("설문 응답을 찾을 수 없어요. 처음부터 다시 진행해주세요.");
      return;
    }
    const answers = loadSurveyAnswers(eventSlug);

    const response = await fetch("/api/participants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, eventSlug, answers }),
    });
    const data = await response.json();

    if (!response.ok || !data.success) {
      if (data.status === "DAILY_LIMIT_REACHED") {
        // 설문 진행 중 다른 사람들이 마지막 자리를 채운 경우 — 폼을 마감 안내 화면으로 전환한다.
        setView({ kind: "full" });
      } else if (data.status === "DUPLICATE_PHONE") {
        setSubmitError("이미 이 전화번호로 등록되어 있어요. 발급받은 카카오톡 패스를 확인해주세요.");
      } else {
        setSubmitError("제출 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.");
      }
      return;
    }

    clearSurveyAnswers(eventSlug);

    // 원래는 카카오톡 알림톡으로 QR을 받는 흐름이지만, 개발/모의(mock) 단계에서는
    // 알림톡을 기다리지 않고 곧바로 QR 확인 페이지로 이동한다.
    if (data.participantId) {
      navigate(ROUTES.eventPass(eventSlug, data.participantId), { replace: true });
      return;
    }

    setView({
      kind: "success",
      qrImageUrl: data.qrImageUrl ?? null,
      participantId: data.participantId ?? null,
      customerNo: data.customerNo ?? null,
    });
  }

  if (view.kind === "full") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <EventLogo name={eventName} logo={eventLogo} />
        <p className="text-xl font-bold text-event-primary">선착순 모집이 마감되었어요</p>
        <p className="text-sm text-muted-foreground">
          아쉽게도 오늘의 정원이 모두 찼습니다. 다음 기회에 만나요!
        </p>
      </div>
    );
  }

  if (view.kind === "success") {
    return (
      <CompleteSuccessView
        eventName={eventName}
        eventLogo={eventLogo}
        qrImageUrl={view.qrImageUrl}
        participantId={view.participantId}
        customerNo={view.customerNo}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col justify-center gap-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <EventLogo name={eventName} logo={eventLogo} />
        <p className="text-xl font-bold text-event-primary">{resultHeadline}</p>
        <p className="text-sm font-medium">{resultSubline}</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">이름</Label>
          <Input id="name" placeholder="이름을 입력해주세요" {...register("name")} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">연락처</Label>
          <Controller
            control={control}
            name="phone"
            render={({ field }) => (
              <Input
                id="phone"
                inputMode="numeric"
                placeholder="010-0000-0000"
                value={field.value}
                onChange={(e) => field.onChange(formatPhone(e.target.value))}
              />
            )}
          />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        현장에서 카카오톡 패스만 보여주시면
        <br />
        대기표 없이 즉시 입장 가능합니다.
      </p>

      <div className="space-y-3">
        <Controller
          control={control}
          name="privacyAgreed"
          render={({ field }) => (
            <Label className="gap-2 font-normal">
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              {privacyConsentLabel}
            </Label>
          )}
        />
        {errors.privacyAgreed && (
          <p className="text-xs text-destructive">{errors.privacyAgreed.message}</p>
        )}
        <Controller
          control={control}
          name="marketingAgreed"
          render={({ field }) => (
            <Label className="gap-2 font-normal">
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              {marketingConsentLabel}
            </Label>
          )}
        />
      </div>

      {submitError && <p className="text-center text-xs text-destructive">{submitError}</p>}

      <EventCtaButton type="submit" disabled={isSubmitting}>
        {isSubmitting ? "처리 중..." : "카카오톡으로 Fast Track 패스 받기"}
      </EventCtaButton>

      <p className="text-center text-[11px] text-muted-foreground">
        *입장용 바코드가 포함된 카카오톡 알림톡이 즉시 발송됩니다.
      </p>
    </form>
  );
}
