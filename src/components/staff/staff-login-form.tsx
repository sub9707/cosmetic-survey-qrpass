import { DemoLoginForm } from "@/components/shared/demo-login-form";
import { DEMO_STAFF_PASSWORD, DEMO_STAFF_USERNAME } from "@/lib/constants";

export function StaffLoginForm() {
  return (
    <DemoLoginForm
      title="직원 로그인"
      accounts={[
        {
          label: "직원으로 로그인",
          username: DEMO_STAFF_USERNAME,
          password: DEMO_STAFF_PASSWORD,
          afterLoginPath: "/staff",
        },
      ]}
    />
  );
}
