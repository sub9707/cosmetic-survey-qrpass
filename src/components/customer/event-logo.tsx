import Image from "next/image";
import { cn } from "@/lib/utils";
import type { EventSummary } from "@/types/event";

interface EventLogoProps {
  name: string;
  logo?: EventSummary["logo"];
  size?: "lg" | "sm";
}

/** 행사 로고 표시. logo 이미지가 있으면 그걸 쓰고, 없으면 이름을 텍스트로 보여준다. */
export function EventLogo({ name, logo, size = "lg" }: EventLogoProps) {
  if (logo) {
    return (
      <Image
        src={logo.src}
        alt={name}
        width={logo.width}
        height={logo.height}
        priority
        className={cn("h-auto w-full", size === "lg" ? "max-w-96" : "max-w-72")}
      />
    );
  }

  return (
    <h1
      className={cn(
        "text-center leading-tight font-extrabold text-event-primary",
        size === "lg" ? "text-4xl" : "text-2xl",
      )}
    >
      {name}
    </h1>
  );
}
