"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
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
}

export function CompleteForm({
  eventSlug,
  eventName,
  eventLogo,
  copy,
  questionIds,
}: CompleteFormProps) {
  const router = useRouter();
  const resultHeadline = copy?.resultHeadline ?? "설문이 완료되었어요!";
  const resultSubline = copy?.resultSubline ?? "입장권을 받기 위해 아래 정보를 입력해주세요.";
  const privacyConsentLabel = copy?.privacyConsentLabel ?? "[필수] 개인정보 수집 및 이용 동의";
  const marketingConsentLabel = copy?.marketingConsentLabel ?? "[선택] 마케팅 정보 수신 동의";

  const [submittedQrDataUrl, setSubmittedQrDataUrl] = useState<string | undefined | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 설문을 다 안 채우고 이 페이지에 직접 접근했거나(URL 직접 입력, 새로고침, 뒤로가기 등)
  // 답변이 유실/불완전한 경우 처음 페이지로 돌려보낸다.
  useEffect(() => {
    if (!hasCompleteSurveyAnswers(eventSlug, questionIds)) {
      toast.error("설문을 먼저 진행해주세요.");
      router.replace(ROUTES.event(eventSlug));
    }
  }, [eventSlug, questionIds, router]);

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
      setSubmitError("제출 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.");
      return;
    }

    clearSurveyAnswers(eventSlug);
    setSubmittedQrDataUrl(data.debugQrDataUrl ?? null);
  }

  if (submittedQrDataUrl !== null) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <EventLogo name={eventName} logo={eventLogo} />
        <p className="text-xl font-bold text-event-primary">발송 완료!</p>
        <p className="text-sm text-muted-foreground">
          카카오톡으로 입장용 Fast Track 패스가 곧 도착해요.
        </p>
        {submittedQrDataUrl && (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-event-primary/30 p-4">
            <Image src={submittedQrDataUrl} alt="입장용 QR" width={160} height={160} unoptimized />
            <p className="text-xs text-muted-foreground">
              (데모 모드 미리보기 — 실연동 시 카카오톡으로만 전달됩니다)
            </p>
          </div>
        )}
      </div>
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
