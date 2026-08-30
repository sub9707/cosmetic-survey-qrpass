import type { QrImageStorage } from "@/lib/storage/types";

/**
 * 라즈베리파이 미디어 서버(ref/api.js)를 QR 이미지 저장소로 쓰는 임시 구현체.
 * 나중에 외부 오브젝트 스토리지로 교체할 때는 Storage 인터페이스는 그대로 두고
 * 이 파일만 바꾸면 된다 (db/provider.ts와 동일한 패턴).
 *
 * 미디어 서버는 인증 없이 호출한다 (내부망 전용).
 * - POST /upload/:path* : :path*는 "저장할 디렉토리"이고, 파일명은 FormData 파일의 filename을 그대로 쓴다.
 * - GET /file/:path* : 업로드 때와 같은 경로로 그대로 조회 가능.
 */
function getBaseUrl(): string {
  return (process.env.MEDIA_SERVER_URL ?? "http://subdevpi.mywire.org:3000").replace(/\/+$/, "");
}

export const mediaServerStorage: QrImageStorage = {
  async uploadQrImage({ eventId, participantId, buffer }) {
    const baseUrl = getBaseUrl();
    const directory = `qr/${eventId}`;
    const fileName = `${participantId}.png`;

    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(buffer)], { type: "image/png" }), fileName);

    const res = await fetch(`${baseUrl}/upload/${directory}`, {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      throw new Error(`QR 이미지 업로드 실패 (status=${res.status})`);
    }

    return { url: `${baseUrl}/file/${directory}/${fileName}` };
  },
};
