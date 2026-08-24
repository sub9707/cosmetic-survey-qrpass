import type { ParticipantRepository, StaffRepository } from "@/lib/db/repositories/types";

let cachedParticipants: Promise<ParticipantRepository> | undefined;
let cachedStaff: Promise<StaffRepository> | undefined;

/**
 * DB_PROVIDER 환경변수로 실제 어댑터를 고른다.
 * - mysql: 홈랩 MySQL (MYSQL_* 환경변수 필요, .env.local.example 참고)
 * - 그 외/미설정: MySQL 연결 정보가 아직 없을 때 쓰는 임시 in-memory 어댑터
 *
 * mysql 어댑터는 동적 import로만 불러온다. 정적으로 import하면
 * DB_PROVIDER=memory인 상태에서도 MySQL 커넥션 풀이 생성되면서
 * 환경변수 누락 에러가 즉시 던져지기 때문이다.
 */
export function getParticipantRepository(): Promise<ParticipantRepository> {
  if (!cachedParticipants) {
    cachedParticipants =
      process.env.DB_PROVIDER === "mysql"
        ? import("@/lib/db/repositories/mysql/participant-repository").then(
            (m) => m.mysqlParticipantRepository,
          )
        : import("@/lib/db/repositories/memory/participant-repository").then(
            (m) => m.participantRepository,
          );
  }
  return cachedParticipants;
}

export function getStaffRepository(): Promise<StaffRepository> {
  if (!cachedStaff) {
    cachedStaff =
      process.env.DB_PROVIDER === "mysql"
        ? import("@/lib/db/repositories/mysql/staff-repository").then((m) => m.mysqlStaffRepository)
        : import("@/lib/db/repositories/memory/staff-repository").then((m) => m.staffRepository);
  }
  return cachedStaff;
}
