import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPhone } from "@/lib/utils/phone";
import {
  adminParticipantUpdateSchema,
  type AdminParticipantUpdateInput,
} from "@/lib/validation/participant";
import type { AdminParticipantSummary } from "@/types/participant";

interface Props {
  participant: AdminParticipantSummary | null;
  onClose: () => void;
  onSubmit: (
    participantId: string,
    input: AdminParticipantUpdateInput,
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
}

export function AdminParticipantEditDialog({ participant, onClose, onSubmit }: Props) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdminParticipantUpdateInput>({
    resolver: zodResolver(adminParticipantUpdateSchema),
    defaultValues: { name: "", phone: "" },
  });

  useEffect(() => {
    if (participant) {
      setSubmitError(null);
      reset({ name: participant.name, phone: formatPhone(participant.phone) });
    }
  }, [participant, reset]);

  async function submit(values: AdminParticipantUpdateInput) {
    if (!participant) return;
    setSubmitError(null);
    const result = await onSubmit(participant.id, values);
    if (result.ok) {
      onClose();
      return;
    }
    setSubmitError(result.message);
  }

  return (
    <Dialog open={participant !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>참여자 정보 수정</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">이름</Label>
            <Input id="edit-name" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-phone">연락처</Label>
            <Controller
              control={control}
              name="phone"
              render={({ field }) => (
                <Input
                  id="edit-phone"
                  inputMode="numeric"
                  placeholder="010-0000-0000"
                  value={field.value}
                  onChange={(e) => field.onChange(formatPhone(e.target.value))}
                />
              )}
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>
          {submitError && <p className="text-xs text-destructive">{submitError}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "저장 중…" : "저장"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
