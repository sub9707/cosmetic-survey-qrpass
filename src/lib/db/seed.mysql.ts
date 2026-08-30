import bcrypt from "bcryptjs";
import { DEMO_EVENT } from "@/lib/data/demo-event";
import { mysqlDb } from "@/lib/db/client.mysql";
import { events, eventStaff, questions, staff } from "@/lib/db/schema.mysql";
import {
  DEMO_ADMIN_PASSWORD,
  DEMO_ADMIN_USERNAME,
  DEMO_STAFF_PASSWORD,
  DEMO_STAFF_USERNAME,
} from "@/lib/constants";

const DEMO_STAFF_ID = "demo-staff-1";
const DEMO_ADMIN_ID = "demo-admin-1";

/**
 * 데모 행사(events/questions) + 데모 직원/관리자 계정을 MySQL에 심는 스크립트.
 * participants가 events.id를 FK로 참조하므로, 참가자 등록 전에
 * 행사 row가 먼저 있어야 한다. `npm run db:seed`로 실행.
 */
async function main() {
  await mysqlDb
    .insert(events)
    .values({
      id: DEMO_EVENT.id,
      name: DEMO_EVENT.name,
      slug: DEMO_EVENT.slug,
      status: DEMO_EVENT.status,
    })
    .onDuplicateKeyUpdate({ set: { name: DEMO_EVENT.name, status: DEMO_EVENT.status } });

  for (const q of DEMO_EVENT.questions) {
    await mysqlDb
      .insert(questions)
      .values({
        id: `${DEMO_EVENT.id}-${q.id}`,
        eventId: DEMO_EVENT.id,
        question: q.question,
        options: q.choices,
        sortOrder: q.order,
        required: true,
      })
      .onDuplicateKeyUpdate({ set: { question: q.question, options: q.choices, sortOrder: q.order } });
  }

  const staffPasswordHash = await bcrypt.hash(DEMO_STAFF_PASSWORD, 10);
  await mysqlDb
    .insert(staff)
    .values({
      id: DEMO_STAFF_ID,
      name: "김직원",
      username: DEMO_STAFF_USERNAME,
      passwordHash: staffPasswordHash,
      role: "STAFF",
    })
    .onDuplicateKeyUpdate({ set: { name: "김직원", passwordHash: staffPasswordHash } });

  await mysqlDb
    .insert(eventStaff)
    .values({ eventId: DEMO_EVENT.id, staffId: DEMO_STAFF_ID })
    .onDuplicateKeyUpdate({ set: { eventId: DEMO_EVENT.id } });

  const adminPasswordHash = await bcrypt.hash(DEMO_ADMIN_PASSWORD, 10);
  await mysqlDb
    .insert(staff)
    .values({
      id: DEMO_ADMIN_ID,
      name: "박관리자",
      username: DEMO_ADMIN_USERNAME,
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    })
    .onDuplicateKeyUpdate({ set: { name: "박관리자", passwordHash: adminPasswordHash } });

  await mysqlDb
    .insert(eventStaff)
    .values({ eventId: DEMO_EVENT.id, staffId: DEMO_ADMIN_ID })
    .onDuplicateKeyUpdate({ set: { eventId: DEMO_EVENT.id } });

  console.log(`시드 완료: 행사 "${DEMO_EVENT.name}" + 문항 ${DEMO_EVENT.questions.length}개`);
  console.log(`데모 직원 계정: ${DEMO_STAFF_USERNAME} / ${DEMO_STAFF_PASSWORD}`);
  console.log(`데모 관리자 계정: ${DEMO_ADMIN_USERNAME} / ${DEMO_ADMIN_PASSWORD}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
