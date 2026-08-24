import type { ReactNode } from "react";

/**
 * 고객용 화면 공통 레이아웃: 모바일 우선 폭 고정 + 상하단 브랜드 바.
 * 행사마다 반복 사용하므로 페이지 컴포넌트에서 이 하나만 감싸면 된다.
 */
export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <div className="event-container">
      <div className="h-3 shrink-0 bg-event-primary" />
      <main className="flex flex-1 flex-col justify-center px-6 py-10">{children}</main>
      <div className="h-3 shrink-0 bg-event-primary" />
    </div>
  );
}
