import { z } from "zod";

export const staffLoginSchema = z.object({
  username: z.string().trim().min(1, "아이디를 입력해주세요."),
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});

export type StaffLoginInput = z.infer<typeof staffLoginSchema>;

export const checkInSchema = z.object({
  token: z.string().min(1),
  eventId: z.string().min(1),
});

export type CheckInInput = z.infer<typeof checkInSchema>;
