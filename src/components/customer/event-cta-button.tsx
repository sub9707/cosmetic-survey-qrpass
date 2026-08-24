import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

const ctaClassName =
  "block w-full rounded-lg bg-event-primary px-6 py-4 text-center text-base font-bold text-event-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none";

type LinkCtaProps = { href: string; className?: string; children: React.ReactNode };
type ButtonCtaProps = { href?: undefined } & ComponentPropsWithoutRef<"button">;

/** 고객 화면 전용 primary CTA (설문 시작, 제출 버튼 등에서 재사용). */
export function EventCtaButton(props: LinkCtaProps | ButtonCtaProps) {
  if (props.href) {
    const { href, className, children } = props;
    return (
      <Link href={href} className={cn(ctaClassName, className)}>
        {children}
      </Link>
    );
  }
  const { className, ...buttonProps } = props;
  return <button type="button" className={cn(ctaClassName, className)} {...buttonProps} />;
}
