import type { EventSurveyQuestion } from "@/types/event";

export function SurveyQuestionText({ question }: { question: EventSurveyQuestion }) {
  return (
    <div className="space-y-2 text-center">
      <p className="text-lg font-bold text-event-primary">Q{question.order}.</p>
      <p className="text-lg leading-snug font-bold whitespace-pre-line">{question.question}</p>
    </div>
  );
}
