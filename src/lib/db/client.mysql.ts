import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "@/lib/db/schema.mysql";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`환경변수 ${name}가 설정되지 않았습니다. .env.local.example을 참고해 .env.local을 채워주세요.`);
  }
  return value;
}

// Next.js dev 서버 hot reload마다 새 커넥션 풀이 생기지 않도록 전역에 캐시한다.
declare global {
  var __mysqlPool: mysql.Pool | undefined;
}

function createPool(): mysql.Pool {
  return mysql.createPool({
    host: process.env.MYSQL_HOST ?? "localhost",
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user: requireEnv("MYSQL_USER"),
    password: process.env.MYSQL_PASSWORD ?? "",
    database: requireEnv("MYSQL_DATABASE"),
    connectionLimit: 10,
    dateStrings: false,
    // 한글 등 멀티바이트 문자가 깨지지 않도록 명시 (mysql2 기본값은 4바이트 문자를 지원하지 않음)
    charset: "utf8mb4",
  });
}

const pool = globalThis.__mysqlPool ?? createPool();
if (process.env.NODE_ENV !== "production") {
  globalThis.__mysqlPool = pool;
}

export const mysqlDb = drizzle(pool, { schema, mode: "default" });
