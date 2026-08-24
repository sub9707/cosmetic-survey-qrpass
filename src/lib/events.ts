import { DEMO_EVENT } from "@/lib/data/demo-event";
import type { EventDetail } from "@/types/event";

/**
 * 행사 조회 진입점. 지금은 데모 데이터를 반환하지만,
 * DB 연결 후에는 이 함수 내부만 Repository 호출로 교체하면 된다
 * (호출부인 페이지 컴포넌트는 변경 불필요).
 */
export async function getEventBySlug(slug: string): Promise<EventDetail | null> {
  if (slug === DEMO_EVENT.slug) return DEMO_EVENT;
  return null;
}
