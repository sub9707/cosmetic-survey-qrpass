import type { ComponentPropsWithoutRef } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const ctaClassName =
  "block w-full rounded-lg bg-event-primary px-6 py-4 text-center text-base font-bold text-event-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none";

type LinkCtaProps = {
  href: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
};
type ButtonCtaProps = { href?: undefined } & ComponentPropsWithoutRef<"button">;

/** 고객 화면 전용 primary CTA (설문 시작, 제출 버튼 등에서 재사용). */
export function EventCtaButton(props: LinkCtaProps | ButtonCtaProps) {
  if (props.href) {
    const { href, disabled, className, children } = props;
    if (disabled) {
      // <Link>는 네이티브 disabled가 없으므로, 비활성 상태는 클릭 불가능한 span으로 렌더링한다.
      return (
        <span aria-disabled="true" className={cn(ctaClassName, "pointer-events-none opacity-50", className)}>
          {children}
        </span>
      );
    }
    return (
      <Link to={href} className={cn(ctaClassName, className)}>
        {children}
      </Link>
    );
  }
  const { className, ...buttonProps } = props;
  return <button type="button" className={cn(ctaClassName, className)} {...buttonProps} />;
}
