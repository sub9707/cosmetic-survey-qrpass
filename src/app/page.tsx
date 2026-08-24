import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import { DEMO_EVENT } from "@/lib/data/demo-event";

// 플랫폼 공용 랜딩이 생기기 전까지, 데모 행사로 바로 이동한다.
export default function RootPage() {
  redirect(ROUTES.event(DEMO_EVENT.slug));
}
