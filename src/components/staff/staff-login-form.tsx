import { DemoLoginForm } from "@/components/shared/demo-login-form";
import { DEMO_STAFF_PASSWORD, DEMO_STAFF_USERNAME } from "@/lib/constants";

export function StaffLoginForm() {
  return (
    <DemoLoginForm
      title="직원 로그인"
      demoUsername={DEMO_STAFF_USERNAME}
      demoPassword={DEMO_STAFF_PASSWORD}
      afterLoginPath="/staff"
    />
  );
}
