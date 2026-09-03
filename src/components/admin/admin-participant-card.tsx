import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminParticipantSummary } from "@/types/participant";

const NOTIFICATION_LABEL: Record<string, string> = {
  PENDING: "발송 대기",
  SENT: "발송 완료",
  FAILED: "발송 실패",
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

export function AdminParticipantCard({
  participant,
  onEdit,
  onRemove,
}: {
  participant: AdminParticipantSummary;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const isCheckedIn = Boolean(participant.checkedInAt);

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">{participant.name}</p>
          <p className="text-sm text-muted-foreground">{participant.phone}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant={isCheckedIn ? "default" : "outline"}>
            {isCheckedIn ? `입장 ${formatTime(participant.checkedInAt!)}` : "미입장"}
          </Badge>
          <Badge variant="secondary">
            {NOTIFICATION_LABEL[participant.notificationStatus] ?? participant.notificationStatus}
          </Badge>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
          <Pencil />
          수정
        </Button>
        <Button variant="destructive" size="sm" onClick={onRemove}>
          <Trash2 />
          삭제
        </Button>
      </div>
    </div>
  );
}
