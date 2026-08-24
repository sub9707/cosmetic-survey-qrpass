import { ChoiceOption } from "@/components/customer/choice-option";
import { CHOICE_LABELS, type ChoiceLabel } from "@/lib/constants";
import type { EventSurveyQuestion } from "@/types/event";

interface SurveyChoiceListProps {
  question: EventSurveyQuestion;
  selected: ChoiceLabel | undefined;
  onSelect: (choice: ChoiceLabel) => void;
}

export function SurveyChoiceList({ question, selected, onSelect }: SurveyChoiceListProps) {
  return (
    <div className="flex flex-col gap-3">
      {CHOICE_LABELS.map((label) => (
        <ChoiceOption
          key={label}
          label={label}
          text={question.choices[label]}
          selected={selected === label}
          onSelect={() => onSelect(label)}
        />
      ))}
    </div>
  );
}
