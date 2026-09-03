import { useOutletContext } from "react-router-dom";
import type { EventSummary } from "@/types/event";

export interface StaffOutletContext {
  event: EventSummary;
  todayCount: number;
}

/** 스태프 하위 페이지(입장명단/스캔)에서 현재 행사 정보를 가져온다. StaffLayout이 제공. */
export function useStaffEventCtx(): StaffOutletContext {
  return useOutletContext<StaffOutletContext>();
}
