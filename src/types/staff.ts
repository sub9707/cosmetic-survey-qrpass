import type { StaffRole } from "@/lib/constants";

export interface Staff {
  id: string;
  name: string;
  username: string;
  passwordHash: string;
  role: StaffRole;
}

/** JWT에 담기는 최소 정보. 매 요청마다 이걸로 권한을 재검증한다 (draft.md §5). */
export interface StaffSession {
  staffId: string;
  name: string;
  role: StaffRole;
}
