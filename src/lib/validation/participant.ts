import { z } from "zod";
import { CHOICE_LABELS } from "@/lib/constants";
import { isValidKoreanMobile, normalizePhone } from "@/lib/utils/phone";

export const participantAnswerSchema = z.object({
  questionId: z.string().min(1),
  choice: z.enum(CHOICE_LABELS),
});

/** 제출 폼에서 사용자가 직접 입력하는 필드만 (이름/연락처/동의) */
export const participantFormSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해주세요.").max(50),
  phone: z.string().trim().refine(isValidKoreanMobile, "휴대폰 번호 형식을 확인해주세요."),
  privacyAgreed: z.boolean().refine((v) => v === true, {
    message: "개인정보 수집·이용에 동의해주세요.",
  }),
  marketingAgreed: z.boolean(),
});

/** 서버로 실제 전송되는 전체 payload: 폼 필드 + 행사/설문 응답 */
export const participantSubmitSchema = participantFormSchema.extend({
  eventSlug: z.string().min(1),
  phone: participantFormSchema.shape.phone.transform(normalizePhone),
  answers: z.array(participantAnswerSchema).min(1),
});

/** 관리자 참여자 정보 수정 (이름/연락처만) */
export const adminParticipantUpdateSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해주세요.").max(50),
  phone: z.string().trim().refine(isValidKoreanMobile, "휴대폰 번호 형식을 확인해주세요."),
});

export type ParticipantFormInput = z.infer<typeof participantFormSchema>;
export type ParticipantSubmitInput = z.infer<typeof participantSubmitSchema>;
export type AdminParticipantUpdateInput = z.infer<typeof adminParticipantUpdateSchema>;
