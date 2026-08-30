import bcrypt from "bcryptjs";
import { DEMO_EVENT } from "@/lib/data/demo-event";
import type { StaffRepository } from "@/lib/db/repositories/types";
import {
  DEMO_ADMIN_PASSWORD,
  DEMO_ADMIN_USERNAME,
  DEMO_STAFF_PASSWORD,
  DEMO_STAFF_USERNAME,
} from "@/lib/constants";
import type { EventSummary } from "@/types/event";
import type { Staff } from "@/types/staff";

/** MySQL 연결 전 로컬 테스트용 데모 계정 */
const DEMO_STAFF: Staff = {
  id: "demo-staff-1",
  name: "김직원",
  username: DEMO_STAFF_USERNAME,
  passwordHash: bcrypt.hashSync(DEMO_STAFF_PASSWORD, 10),
  role: "STAFF",
};

const DEMO_ADMIN: Staff = {
  id: "demo-admin-1",
  name: "박관리자",
  username: DEMO_ADMIN_USERNAME,
  passwordHash: bcrypt.hashSync(DEMO_ADMIN_PASSWORD, 10),
  role: "ADMIN",
};

class InMemoryStaffRepository implements StaffRepository {
  async findByUsername(username: string): Promise<Staff | null> {
    if (username === DEMO_STAFF.username) return DEMO_STAFF;
    if (username === DEMO_ADMIN.username) return DEMO_ADMIN;
    return null;
  }

  async listAssignedEvents(staffId: string): Promise<EventSummary[]> {
    return staffId === DEMO_STAFF.id || staffId === DEMO_ADMIN.id ? [DEMO_EVENT] : [];
  }
}

export const staffRepository: StaffRepository = new InMemoryStaffRepository();
