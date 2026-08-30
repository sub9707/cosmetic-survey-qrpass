// pm2 start ecosystem.config.js 는 프로젝트 루트에서 실행해야 한다.
// (.env.local을 이 파일 기준 상대경로로 읽기 때문)
require("dotenv").config({ path: ".env.local" });

module.exports = {
  apps: [
    {
      name: "qr-pass",
      cwd: ".",
      // Express 서버를 tsx로 직접 실행한다 (Next.js standalone 빌드/복사 스크립트 불필요).
      // 배포 절차: `npm run build`(vite build → dist/client) 후 pm2 재시작.
      script: "node_modules/.bin/tsx",
      args: "server/index.ts",
      env: {
        NODE_ENV: "production",
        PORT: process.env.PORT || 4001,
        HOSTNAME: "0.0.0.0",
        DB_PROVIDER: process.env.DB_PROVIDER,
        MYSQL_HOST: process.env.MYSQL_HOST,
        MYSQL_PORT: process.env.MYSQL_PORT,
        MYSQL_USER: process.env.MYSQL_USER,
        MYSQL_PASSWORD: process.env.MYSQL_PASSWORD,
        MYSQL_DATABASE: process.env.MYSQL_DATABASE,
        JWT_SECRET: process.env.JWT_SECRET,
        PII_ENCRYPTION_KEY: process.env.PII_ENCRYPTION_KEY,
        KAKAO_MODE: process.env.KAKAO_MODE,
        KAKAO_API_KEY: process.env.KAKAO_API_KEY,
        KAKAO_SENDER_KEY: process.env.KAKAO_SENDER_KEY,
        KAKAO_TEMPLATE_CODE: process.env.KAKAO_TEMPLATE_CODE,
        MEDIA_SERVER_URL: process.env.MEDIA_SERVER_URL,
        APP_URL: process.env.APP_URL,
      },
    },
  ],
};
