import {
  boolean,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/mysql-core";
import { EVENT_STATUSES, NOTIFICATION_STATUSES, STAFF_ROLES } from "@/lib/constants";

/**
 * 홈랩 MySQL 스키마 (draft.md §7 + draft-modular-coral.md §3).
 * 이후 Workers 단계에서 schema.pg.ts로 동일 테이블 구조를 만들 예정이며,
 * 호출부는 Repository 인터페이스만 보므로 이 파일이 바뀌어도 영향받지 않는다.
 */

export const events = mysqlTable("events", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  startAt: timestamp("start_at"),
  endAt: timestamp("end_at"),
  status: mysqlEnum("status", EVENT_STATUSES).notNull().default("DRAFT"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const questions = mysqlTable(
  "questions",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    eventId: varchar("event_id", { length: 36 })
      .notNull()
      .references(() => events.id),
    question: text("question").notNull(),
    /** 4지선다 고정 (draft.md §10): { A: "...", B: "...", C: "...", D: "..." } */
    options: json("options").notNull(),
    sortOrder: int("sort_order").notNull().default(0),
    required: boolean("required").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("questions_event_id_idx").on(table.eventId)],
);

export const participants = mysqlTable(
  "participants",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    eventId: varchar("event_id", { length: 36 })
      .notNull()
      .references(() => events.id),
    /** AES-256-GCM으로 암호화해서 저장 (src/lib/security/pii.ts). 평문 저장 금지. */
    name: text("name").notNull(),
    /** 위와 동일하게 암호화 저장. 조회/중복확인은 phoneLookupHash로 한다. */
    phone: text("phone").notNull(),
    /** 전화번호의 HMAC 블라인드 인덱스 — 같은 행사에 같은 번호로 중복등록되는 걸 막는 용도 */
    phoneLookupHash: varchar("phone_lookup_hash", { length: 64 }).notNull(),
    privacyAgreed: boolean("privacy_agreed").notNull(),
    marketingAgreed: boolean("marketing_agreed").notNull().default(false),
    /** 입장 스캔 조회용 단방향 해시 (draft.md §7) */
    qrTokenHash: varchar("qr_token_hash", { length: 64 }).notNull().unique(),
    /**
     * QR에 담기는 원문 토큰. 미디어 서버 업로드가 실패했을 때 pass 페이지에서 QR을
     * 다시 그리기 위해 저장한다. (기존 행에는 없을 수 있어 nullable)
     */
    qrToken: varchar("qr_token", { length: 36 }),
    /** 미디어 서버에 업로드된 실제 QR 이미지 URL (업로드 전/실패 시 null) */
    qrImageUrl: varchar("qr_image_url", { length: 500 }),
    notificationStatus: mysqlEnum("notification_status", NOTIFICATION_STATUSES)
      .notNull()
      .default("PENDING"),
    checkedInAt: timestamp("checked_in_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("participants_event_id_idx").on(table.eventId),
    index("participants_qr_token_hash_idx").on(table.qrTokenHash),
    index("participants_created_at_idx").on(table.createdAt),
    // 같은 행사에 같은 전화번호로 중복등록 방지 (DB 제약으로 동시요청 레이스까지 차단)
    unique("participants_event_phone_lookup_idx").on(table.eventId, table.phoneLookupHash),
  ],
);

export const answers = mysqlTable(
  "answers",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    participantId: varchar("participant_id", { length: 36 })
      .notNull()
      .references(() => participants.id),
    questionId: varchar("question_id", { length: 36 }).notNull(),
    /** A/B/C/D 선택지 라벨 */
    answer: varchar("answer", { length: 10 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("answers_participant_id_idx").on(table.participantId),
    index("answers_question_id_idx").on(table.questionId),
  ],
);

export const staff = mysqlTable("staff", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: mysqlEnum("role", STAFF_ROLES).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const eventStaff = mysqlTable(
  "event_staff",
  {
    eventId: varchar("event_id", { length: 36 })
      .notNull()
      .references(() => events.id),
    staffId: varchar("staff_id", { length: 36 })
      .notNull()
      .references(() => staff.id),
  },
  (table) => [primaryKey({ columns: [table.eventId, table.staffId] })],
);

export const checkIns = mysqlTable(
  "check_ins",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    participantId: varchar("participant_id", { length: 36 })
      .notNull()
      .references(() => participants.id),
    staffId: varchar("staff_id", { length: 36 })
      .notNull()
      .references(() => staff.id),
    checkedInAt: timestamp("checked_in_at").notNull().defaultNow(),
  },
  (table) => [
    index("check_ins_participant_id_idx").on(table.participantId),
    index("check_ins_staff_id_idx").on(table.staffId),
    index("check_ins_checked_in_at_idx").on(table.checkedInAt),
  ],
);

/**
 * 하루 선착순 정원(100명) 카운터. event_id+date(YYYY-MM-DD, KST 기준 문자열)당 한 행이며,
 * 참가자 등록은 이 행에 대한 조건부 UPDATE(count < limit)로만 정원을 확보한다 —
 * check_ins의 atomicCheckIn과 같은 "조건부 UPDATE 하나로 원자성 확보" 패턴.
 */
export const dailyCounters = mysqlTable(
  "daily_counters",
  {
    eventId: varchar("event_id", { length: 36 })
      .notNull()
      .references(() => events.id),
    date: varchar("date", { length: 10 }).notNull(),
    count: int("count").notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.eventId, table.date] })],
);
