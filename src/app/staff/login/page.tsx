import { Suspense } from "react";
import { StaffLoginForm } from "@/components/staff/staff-login-form";

export default function StaffLoginPage() {
  return (
    <Suspense>
      <StaffLoginForm />
    </Suspense>
  );
}
