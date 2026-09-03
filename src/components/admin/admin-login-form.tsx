import { DemoLoginForm } from "@/components/shared/demo-login-form";
import {
  DEMO_ADMIN_PASSWORD,
  DEMO_ADMIN_USERNAME,
  DEMO_STAFF_PASSWORD,
  DEMO_STAFF_USERNAME,
} from "@/lib/constants";

export function AdminLoginForm() {
  return (
    <DemoLoginForm
      title="관리자 로그인"
      accounts={[
        {
          label: "어드민으로 데모 로그인",
          username: DEMO_ADMIN_USERNAME,
          password: DEMO_ADMIN_PASSWORD,
          afterLoginPath: "/admin",
        },
        {
          label: "스탭으로 데모 로그인",
          username: DEMO_STAFF_USERNAME,
          password: DEMO_STAFF_PASSWORD,
          afterLoginPath: "/staff",
        },
      ]}
    />
  );
}
