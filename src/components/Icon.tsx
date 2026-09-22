import type { JSX } from 'react';

/**
 * 인라인 SVG 아이콘.
 * v1 은 아이콘 여러 개의 서브패스를 공백으로 이어 한 <path> 에 밀어넣어 모양이
 * 어긋나는 경우가 있었다. 여기서는 패스를 분리해 둔다.
 */
const paths: Record<string, JSX.Element> = {
  coffee: (
    <>
      <path d="M17 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <path d="M6 2v2M10 2v2M14 2v2" />
    </>
  ),
  grinder: (
    <>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </>
  ),
  thermometer: <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </>
  ),
  droplet: <path d="M12 2.7 6.8 8.4a7.3 7.3 0 1 0 10.4 0Z" />,
  scale: (
    <>
      <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="M2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="M7 21h10M12 3v18M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
    </>
  ),
  close: <path d="M18 6 6 18M6 6l12 12" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  filter: <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3Z" />,
  youtube: (
    <>
      <path d="M2.5 7.1c.3-1.4 1.4-2.5 2.8-2.8C7.6 4 12 4 12 4s4.4 0 6.7.3c1.4.3 2.5 1.4 2.8 2.8.3 1.5.3 4.6.3 4.6s0 3.1-.3 4.6c-.3 1.4-1.4 2.5-2.8 2.8-2.3.3-6.7.3-6.7.3s-4.4 0-6.7-.3c-1.4-.3-2.5-1.4-2.8-2.8-.3-1.5-.3-4.6-.3-4.6s0-3.1.3-4.6Z" />
      <path d="m10 15 5-3-5-3Z" />
    </>
  ),
  play: <path d="M7 4.5 19 12 7 19.5Z" />,
  pause: <path d="M8 5v14M16 5v14" />,
  reset: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </>
  ),
  star: <path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.8l6.5-.9Z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  swap: (
    <>
      <path d="M3 8h14l-4-4M21 16H7l4 4" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18M8 6V4h8v2M6 6v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6" />
    </>
  ),
  edit: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </>
  ),
  download: <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16" />,
  upload: <path d="M12 15V3m0 0 4 4m-4-4L8 7M4 19h16" />,
  sound: (
    <>
      <path d="M11 5 6 9H3v6h3l5 4Z" />
      <path d="M16 9a4 4 0 0 1 0 6" />
    </>
  ),
  mute: (
    <>
      <path d="M11 5 6 9H3v6h3l5 4Z" />
      <path d="m16 9 5 6M21 9l-5 6" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16v-4M12 8.5h.01" />
    </>
  ),
};

export type IconName = keyof typeof paths;

interface Props {
  name: IconName;
  size?: number;
  className?: string;
  /** 채워진 아이콘 (즐겨찾기 별 등) */
  filled?: boolean;
}

export function Icon({ name, size = 18, className = '', filled = false }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}
