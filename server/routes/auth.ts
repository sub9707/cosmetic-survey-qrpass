import { Router } from "express";
import { verifyPassword } from "@/lib/auth/password";
import { getStaffRepository } from "@/lib/db/provider";
import { staffLoginSchema } from "@/lib/validation/staff";
import { clearStaffSession, createStaffSession } from "../session";

export const authRouter = Router();

authRouter.post("/staff-login", async (req, res) => {
  const parsed = staffLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, status: "INVALID_INPUT" });
    return;
  }

  const staffRepository = await getStaffRepository();
  const staff = await staffRepository.findByUsername(parsed.data.username);
  if (!staff) {
    res.status(401).json({ success: false, status: "INVALID_CREDENTIALS" });
    return;
  }

  const passwordOk = await verifyPassword(parsed.data.password, staff.passwordHash);
  if (!passwordOk) {
    res.status(401).json({ success: false, status: "INVALID_CREDENTIALS" });
    return;
  }

  await createStaffSession(res, { staffId: staff.id, name: staff.name, role: staff.role });
  res.json({ success: true, staff: { name: staff.name, role: staff.role } });
});

authRouter.post("/staff-logout", (_req, res) => {
  clearStaffSession(res);
  res.json({ success: true });
});
