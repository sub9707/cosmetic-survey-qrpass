import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PM2로 실행하기 위한 standalone 서버 출력 (draft-modular-coral.md §8)
  output: "standalone",
};

export default nextConfig;
