export interface QrImageStorage {
  /** QR PNG 버퍼를 저장하고 공개적으로 접근 가능한 URL을 반환한다. */
  uploadQrImage(params: { eventId: string; participantId: string; buffer: Buffer }): Promise<{ url: string }>;
}
