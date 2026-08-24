// next build (output: "standalone")는 public/, .next/static을 standalone 폴더에
// 자동으로 넣어주지 않는다. PM2가 .next/standalone/server.js를 직접 실행하므로
// 빌드 후 매번 이 스크립트로 복사해야 정적 자산이 정상 응답된다.
import { cpSync, existsSync } from "node:fs";

const copies = [
  ["public", ".next/standalone/public"],
  [".next/static", ".next/standalone/.next/static"],
];

for (const [src, dest] of copies) {
  if (!existsSync(src)) continue;
  cpSync(src, dest, { recursive: true });
  console.log(`copied ${src} -> ${dest}`);
}
