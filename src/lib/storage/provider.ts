import { mediaServerStorage } from "@/lib/storage/media-server";
import type { QrImageStorage } from "@/lib/storage/types";

/** 지금은 media-server 구현체만 있다. 나중에 오브젝트 스토리지로 교체되면 여기서 분기한다. */
export function getQrImageStorage(): QrImageStorage {
  return mediaServerStorage;
}
