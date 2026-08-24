import type { NotificationStatus } from "@/lib/constants";
import type { Participant } from "@/types/participant";

export interface NotificationSender {
  send(participant: Participant, qrToken: string): Promise<{ status: NotificationStatus }>;
}
