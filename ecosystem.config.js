// pm2 start ecosystem.config.js 는 프로젝트 루트에서 실행해야 한다.
// (.env.local을 이 파일 기준 상대경로로 읽기 때문)
require("dotenv").config({ path: ".env.local" });

module.exports = {
  apps: [
    {
      name: "qr-pass",
      cwd: "./.next/standalone",
      script: "server.js",
      env: {
        NODE_ENV: "production",
        PORT: process.env.PORT || 3001,
        HOSTNAME: "0.0.0.0",
        DB_PROVIDER: process.env.DB_PROVIDER,
        MYSQL_HOST: process.env.MYSQL_HOST,
        MYSQL_PORT: process.env.MYSQL_PORT,
        MYSQL_USER: process.env.MYSQL_USER,
        MYSQL_PASSWORD: process.env.MYSQL_PASSWORD,
        MYSQL_DATABASE: process.env.MYSQL_DATABASE,
        JWT_SECRET: process.env.JWT_SECRET,
        KAKAO_MODE: process.env.KAKAO_MODE,
        KAKAO_API_KEY: process.env.KAKAO_API_KEY,
        KAKAO_SENDER_KEY: process.env.KAKAO_SENDER_KEY,
        KAKAO_TEMPLATE_CODE: process.env.KAKAO_TEMPLATE_CODE,
        APP_URL: process.env.APP_URL,
      },
    },
  ],
};
