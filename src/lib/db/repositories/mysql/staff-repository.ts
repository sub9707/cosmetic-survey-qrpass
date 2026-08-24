import { eq } from "drizzle-orm";
import { mysqlDb } from "@/lib/db/client.mysql";
import {
  events as eventsTable,
  eventStaff as eventStaffTable,
  staff as staffTable,
} from "@/lib/db/schema.mysql";
import type { StaffRepository } from "@/lib/db/repositories/types";
import type { EventSummary } from "@/types/event";
import type { Staff } from "@/types/staff";

export const mysqlStaffRepository: StaffRepository = {
  async findByUsername(username: string): Promise<Staff | null> {
    const [row] = await mysqlDb.select().from(staffTable).where(eq(staffTable.username, username)).limit(1);
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      username: row.username,
      passwordHash: row.passwordHash,
      role: row.role,
    };
  },

  async listAssignedEvents(staffId: string): Promise<EventSummary[]> {
    const rows = await mysqlDb
      .select({
        id: eventsTable.id,
        slug: eventsTable.slug,
        name: eventsTable.name,
        status: eventsTable.status,
      })
      .from(eventStaffTable)
      .innerJoin(eventsTable, eq(eventStaffTable.eventId, eventsTable.id))
      .where(eq(eventStaffTable.staffId, staffId));

    return rows;
  },
};
