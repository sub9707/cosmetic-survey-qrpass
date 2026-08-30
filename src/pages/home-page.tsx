import { Navigate } from "react-router-dom";
import { DEMO_EVENT } from "@/lib/data/demo-event";
import { ROUTES } from "@/lib/constants";

// 플랫폼 공용 랜딩이 생기기 전까지, 데모 행사로 바로 이동한다.
export default function HomePage() {
  return <Navigate to={ROUTES.event(DEMO_EVENT.slug)} replace />;
}
