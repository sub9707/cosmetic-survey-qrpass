import type { ChoiceLabel, NotificationStatus } from "@/lib/constants";

export interface ParticipantAnswer {
  questionId: string;
  choice: ChoiceLabel;
}

export interface ParticipantInput {
  eventId: string;
  name: string;
  phone: string;
  privacyAgreed: boolean;
  marketingAgreed: boolean;
  answers: ParticipantAnswer[];
}

export interface Participant {
  id: string;
  eventId: string;
  name: string;
  phone: string;
  privacyAgreed: boolean;
  marketingAgreed: boolean;
  answers: ParticipantAnswer[];
  qrTokenHash: string;
  notificationStatus: NotificationStatus;
  checkedInAt: string | null;
  createdAt: string;
}
