import path from "node:path";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";
import { defineConfig } from "vite";

// server/index.ts와 같은 .env.local을 직접 읽는다 — 이 프로세스(vite)는 server/index.ts의
// dotenv.config() 호출과 별도 프로세스라 그쪽에서 읽은 값이 여기로 안 넘어오기 때문.
dotenv.config({ path: ".env.local" });

// Express API 서버(포트는 ecosystem.config.js/.env.local의 PORT와 동일하게 맞춘다)로 /api 요청을 넘긴다.
const apiPort = process.env.PORT || 4001;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      // "localhost"로 두면 Windows에서 ::1(IPv6)로 먼저 해석되는 경우가 있는데, Express는
      // 0.0.0.0(IPv4)에만 바인딩하므로 ECONNREFUSED(AggregateError)가 난다. IP를 명시해 회피.
      "/api": {
        target: `http://127.0.0.1:${apiPort}`,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist/client",
    emptyOutDir: true,
  },
});
