import { NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth/password";
import { createStaffSession } from "@/lib/auth/session";
import { getStaffRepository } from "@/lib/db/provider";
import { staffLoginSchema } from "@/lib/validation/staff";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = staffLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, status: "INVALID_INPUT" }, { status: 400 });
  }

  const staffRepository = await getStaffRepository();
  const staff = await staffRepository.findByUsername(parsed.data.username);
  if (!staff) {
    return NextResponse.json({ success: false, status: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  const passwordOk = await verifyPassword(parsed.data.password, staff.passwordHash);
  if (!passwordOk) {
    return NextResponse.json({ success: false, status: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  await createStaffSession({ staffId: staff.id, name: staff.name, role: staff.role });

  return NextResponse.json({ success: true, staff: { name: staff.name, role: staff.role } });
}
