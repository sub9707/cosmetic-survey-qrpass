import { useOutletContext } from "react-router-dom";
import type { EventSummary } from "@/types/event";

export interface AdminOutletContext {
  event: EventSummary;
}

/** 관리자 하위 페이지(통계/일자별/참여자/입장)에서 현재 행사 정보를 가져온다. AdminLayout이 제공. */
export function useAdminEvent(): AdminOutletContext {
  return useOutletContext<AdminOutletContext>();
}
