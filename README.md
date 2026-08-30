# qr-pass

행사 QR 입장·설문 플랫폼. Node **Express**(API 서버) + **React**(Vite SPA) 구조로 되어 있다.
(라즈베리파이 등 CPU가 제한된 환경에서 매 요청 SSR 비용을 없애기 위해 Next.js에서 전환됨.)

## 구조

- `server/` — Express API 서버 (`/api/*`). 프로덕션에서는 `dist/client`(Vite 빌드 결과)를 정적 서빙 + SPA fallback도 담당한다.
- `src/client/` — SPA 진입점(`main.tsx`, `App.tsx`, 라우팅/훅).
- `src/pages/` — 화면 단위 React 컴포넌트 (react-router 라우트에 매핑).
- `src/components/` — 화면 컴포넌트 (customer/staff/ui).
- `src/lib/` — DB repository, 인증(JWT), QR, 알림, 검증(zod) 등 프레임워크 비종속 로직. Express 라우트가 그대로 사용한다.

## 개발

```bash
docker compose -f docker-compose.dev.yml up -d   # 로컬 MySQL (DB_PROVIDER=mysql일 때)
npm install
npm run dev
```

`npm run dev`는 Express API 서버(`tsx watch server/index.ts`, 기본 포트 3001)와 Vite dev 서버(기본 포트 5173, `/api`를 Express로 프록시)를 동시에 띄운다. 브라우저는 Vite 서버 주소로 접속한다.

## 빌드 / 배포 (PM2)

```bash
npm run build   # vite build → dist/client
npm start       # NODE_ENV=production 아래에서 Express가 dist/client 정적 서빙 + API 서빙
```

라즈베리파이 등에서는 pm2로 실행한다:

```bash
pm2 start ecosystem.config.js
```

## DB

`.env.local.example` 참고. `DB_PROVIDER=mysql`이면 MySQL 어댑터, 아니면 in-memory 어댑터를 사용한다.

```bash
npm run db:generate
npm run db:push
npm run db:seed
```
