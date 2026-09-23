/**
 * 빈 화면에 두는 선 그림 — 드리퍼, 서버, 떨어지는 방울.
 * 인라인 SVG 라 오프라인에서도 그대로 그려지고, 색은 currentColor 를 따라 테마를 탄다.
 */
export function PourOverArt({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* 드리퍼 */}
      <path d="M30 26h60l-20 34H50Z" />
      <path d="M24 26h72" />
      <path d="M50 60h20" />
      {/* 리브 */}
      <path d="M46 32l9 22M60 32v22M74 32l-9 22" opacity=".45" />
      {/* 손잡이 */}
      <path d="M90 32c8 0 10 4 10 8s-3 8-9 9" />
      {/* 방울 */}
      <path d="M60 66c-1.8 2.6-2.6 4.3-2.6 5.6a2.6 2.6 0 0 0 5.2 0c0-1.3-.8-3-2.6-5.6Z" />
      {/* 서버 */}
      <path d="M40 82h40l-3 26a6 6 0 0 1-6 5H49a6 6 0 0 1-6-5Z" />
      <path d="M36 82h48" />
      <path d="M45 98c5 2 25 2 30 0" opacity=".45" />
      {/* 김 */}
      <path d="M52 14c-2-3 2-5 0-8M60 14c-2-3 2-5 0-8M68 14c-2-3 2-5 0-8" opacity=".5" />
    </svg>
  );
}
