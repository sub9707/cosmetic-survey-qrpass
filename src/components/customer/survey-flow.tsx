"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EventLogo } from "@/components/customer/event-logo";
import { SurveyChoiceList } from "@/components/customer/survey-choice-list";
import { SurveyProgressBar } from "@/components/customer/survey-progress-bar";
import { SurveyQuestionText } from "@/components/customer/survey-question-text";
import { ROUTES, type ChoiceLabel } from "@/lib/constants";
import { saveSurveyAnswers } from "@/lib/utils/survey-storage";
import type { EventSummary, EventSurveyQuestion } from "@/types/event";
import type { ParticipantAnswer } from "@/types/participant";

const AUTO_ADVANCE_DELAY_MS = 300;

export function SurveyFlow({
  eventSlug,
  eventName,
  eventLogo,
  questions,
}: {
  eventSlug: string;
  eventName: string;
  eventLogo?: EventSummary["logo"];
  questions: EventSurveyQuestion[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, ChoiceLabel>>({});

  const question = questions[step];
  const isLastStep = step === questions.length - 1;

  function handleSelect(choice: ChoiceLabel) {
    const nextAnswers = { ...answers, [question.id]: choice };
    setAnswers(nextAnswers);

    setTimeout(() => {
      if (!isLastStep) {
        setStep((s) => s + 1);
        return;
      }
      const payload: ParticipantAnswer[] = questions.map((q) => ({
        questionId: q.id,
        choice: nextAnswers[q.id],
      }));
      saveSurveyAnswers(eventSlug, payload);
      router.push(ROUTES.eventComplete(eventSlug));
    }, AUTO_ADVANCE_DELAY_MS);
  }

  return (
    <div className="flex flex-1 flex-col justify-center gap-6">
      {/* 로고 + 진행률 + 문항 텍스트: 한 덩어리로 화면 세로 중앙에 모인다. */}
      <div className="flex flex-col items-center gap-4">
        <EventLogo name={eventName} logo={eventLogo} size="sm" />
        <SurveyProgressBar total={questions.length} current={step} />
      </div>

      {/* 문항 텍스트 자리를 고정 높이로 예약해서, 문항 길이가 달라져도
          이 블록 전체 높이(→ 아래 선택지 위치)는 흔들리지 않는다. */}
      <div className="flex min-h-28 flex-col items-center justify-center">
        <SurveyQuestionText question={question} />
      </div>

      {/* 선택지 4개: 그룹 안에서 항상 같은 위치. */}
      <SurveyChoiceList question={question} selected={answers[question.id]} onSelect={handleSelect} />

      {/* 이전 버튼 자리도 항상 예약해둬서, 유무에 따라 전체 높이가 흔들리지 않게 한다. */}
      <div className="flex h-5 items-center justify-center">
        <button
          type="button"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          aria-hidden={step === 0}
          className="flex items-center gap-0.5 text-sm font-medium text-muted-foreground hover:text-foreground disabled:invisible"
        >
          <ChevronLeft className="size-4" />
          이전
        </button>
      </div>
    </div>
  );
}
