import path from "node:path";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import { adminRouter } from "./routes/admin";
import { authRouter } from "./routes/auth";
import { checkInRouter } from "./routes/check-in";
import { eventsRouter } from "./routes/events";
import { participantsRouter } from "./routes/participants";
import { staffRouter } from "./routes/staff";

// pm2(ecosystem.config.js)는 env를 직접 주입하므로 이미 process.env에 값이 있으면
// dotenv가 덮어쓰지 않는다. `npm run dev`/`npm start`처럼 직접 실행할 때만 채워준다.
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const PORT = Number(process.env.PORT ?? 4001);
const HOSTNAME = process.env.HOSTNAME ?? "0.0.0.0";
const clientDist = path.resolve(process.cwd(), "dist/client");

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/check-in", checkInRouter);
app.use("/api/participants", participantsRouter);
app.use("/api/events", eventsRouter);
app.use("/api/staff", staffRouter);
app.use("/api/admin", adminRouter);

// 개발(dev)에서는 Vite dev 서버가 정적 자산과 HMR을 담당하므로 이 아래는 건너뛴다.
// 프로덕션(pm2)에서는 `npm run build`(vite build)가 만든 dist/client를 여기서 직접 서빙한다.
if (process.env.NODE_ENV === "production") {
  app.use(express.static(clientDist));
  // SPA fallback: /api가 아닌 모든 GET 요청은 index.html로 (클라이언트 라우팅)
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.listen(PORT, HOSTNAME, () => {
  console.log(`qr-pass server listening on http://${HOSTNAME}:${PORT}`);
});
