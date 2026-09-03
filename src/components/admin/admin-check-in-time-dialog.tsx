import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdminParticipantSummary } from "@/types/participant";

/** ISO 문자열 → datetime-local 입력값(YYYY-MM-DDTHH:mm, 로컬 시각) */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
}

interface Props {
  participant: AdminParticipantSummary | null;
  onClose: () => void;
  onSubmit: (
    participantId: string,
    checkedInAtIso: string,
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
}

export function AdminCheckInTimeDialog({ participant, onClose, onSubmit }: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (participant?.checkedInAt) {
      setError(null);
      setValue(toLocalInput(participant.checkedInAt));
    }
  }, [participant]);

  async function submit() {
    if (!participant) return;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      setError("올바른 시각을 입력해주세요.");
      return;
    }
    if (parsed.getTime() > Date.now()) {
      setError("미래 시각은 지정할 수 없어요.");
      return;
    }
    setSaving(true);
    const result = await onSubmit(participant.id, parsed.toISOString());
    setSaving(false);
    if (result.ok) {
      onClose();
      return;
    }
    setError(result.message);
  }

  return (
    <Dialog open={participant !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>입장 시각 수정</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="check-in-time">{participant?.name}</Label>
            <Input
              id="check-in-time"
              type="datetime-local"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              취소
            </Button>
            <Button type="button" size="sm" disabled={saving} onClick={submit}>
              {saving ? "저장 중…" : "저장"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
