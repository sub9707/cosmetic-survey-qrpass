import bcrypt from "bcryptjs";
import { DEMO_EVENT } from "@/lib/data/demo-event";
import type { StaffRepository } from "@/lib/db/repositories/types";
import { DEMO_STAFF_PASSWORD, DEMO_STAFF_USERNAME } from "@/lib/constants";
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

class InMemoryStaffRepository implements StaffRepository {
  async findByUsername(username: string): Promise<Staff | null> {
    return username === DEMO_STAFF.username ? DEMO_STAFF : null;
  }

  async listAssignedEvents(staffId: string): Promise<EventSummary[]> {
    return staffId === DEMO_STAFF.id ? [DEMO_EVENT] : [];
  }
}

export const staffRepository: StaffRepository = new InMemoryStaffRepository();
