import { DemoLoginForm } from "@/components/shared/demo-login-form";
import { DEMO_ADMIN_PASSWORD, DEMO_ADMIN_USERNAME } from "@/lib/constants";

export function AdminLoginForm() {
  return (
    <DemoLoginForm
      title="관리자 로그인"
      demoUsername={DEMO_ADMIN_USERNAME}
      demoPassword={DEMO_ADMIN_PASSWORD}
      afterLoginPath="/admin"
    />
  );
}
