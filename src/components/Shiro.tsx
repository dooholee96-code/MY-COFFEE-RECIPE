/**
 * 아기 토끼 시로 — shirolee studio 의 토끼. 빅 히스토리 연표·출석부 앱과 같은 납작한 타원 그림이다.
 * 인라인 SVG 라 오프라인에서도 그대로 그려지고, 털·윤곽·볼은 테마 토큰을 따라 밤에도 같은 얼굴이다.
 * 장식이므로 aria-hidden. 글로 설명할 일이 있으면 바깥 요소에 적는다.
 */
const fur = 'var(--color-fur)';
const line = 'var(--color-fur-line)';
const blush = 'var(--color-blush)';
const ink = 'var(--color-ink)';

/** 귀·얼굴만 — 헤더의 마크, 아이콘 자리 */
export function ShiroFace({ className = '', size = 36 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="20 2 80 80" width={size} height={size} className={className} aria-hidden="true" focusable="false">
      <ellipse cx="47" cy="30" rx="8" ry="22" transform="rotate(-8 47 30)" fill={fur} stroke={line} strokeWidth="1.5" />
      <ellipse cx="47" cy="32" rx="3.5" ry="14" transform="rotate(-8 47 32)" fill={blush} />
      <ellipse cx="73" cy="30" rx="8" ry="22" transform="rotate(8 73 30)" fill={fur} stroke={line} strokeWidth="1.5" />
      <ellipse cx="73" cy="32" rx="3.5" ry="14" transform="rotate(8 73 32)" fill={blush} />
      <circle cx="60" cy="56" r="26" fill={fur} stroke={line} strokeWidth="1.5" />
      <circle cx="49" cy="54" r="3" fill={ink} />
      <circle cx="71" cy="54" r="3" fill={ink} />
      <circle cx="41" cy="64" r="5.5" fill={blush} />
      <circle cx="79" cy="64" r="5.5" fill={blush} />
      <path d="M56 64q4 4 8 0" fill="none" stroke={ink} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * 커피를 내리는 시로 — 빈 화면의 그림. 드리퍼·서버는 currentColor 선, 시로는 토큰 색.
 * 빈 화면마다 같은 장면을 쓰고, 무엇이 비었는지는 글이 말한다.
 */
export function ShiroBrewing({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 130" className={className} aria-hidden="true" focusable="false">
      {/* 시로 — 서버 뒤에 앉아 있다 */}
      <g transform="translate(22 4)">
        <ellipse cx="60" cy="98" rx="26" ry="16" fill={fur} stroke={line} strokeWidth="1.5" />
        <ellipse cx="47" cy="30" rx="8" ry="22" transform="rotate(-8 47 30)" fill={fur} stroke={line} strokeWidth="1.5" />
        <ellipse cx="47" cy="32" rx="3.5" ry="14" transform="rotate(-8 47 32)" fill={blush} />
        <ellipse cx="73" cy="30" rx="8" ry="22" transform="rotate(8 73 30)" fill={fur} stroke={line} strokeWidth="1.5" />
        <ellipse cx="73" cy="32" rx="3.5" ry="14" transform="rotate(8 73 32)" fill={blush} />
        <circle cx="60" cy="66" r="28" fill={fur} stroke={line} strokeWidth="1.5" />
        <circle cx="49" cy="64" r="3" fill={ink} />
        <circle cx="71" cy="64" r="3" fill={ink} />
        <circle cx="41" cy="74" r="5.5" fill={blush} />
        <circle cx="79" cy="74" r="5.5" fill={blush} />
        <path d="M56 74q4 4 8 0" fill="none" stroke={ink} strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="44" cy="106" rx="7" ry="3.5" fill={fur} stroke={line} strokeWidth="1.2" />
      </g>
      {/* 드리퍼와 서버 — 시로 오른손 앞 */}
      <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M100 62h40l-13 22h-14Z" fill={fur} />
        <path d="M96 62h48" />
        <path d="M110 66l6 14M120 66v14M130 66l-6 14" opacity=".45" />
        <path d="M140 66c6 0 8 3 8 6s-2 6-7 7" />
        {/* 서버 */}
        <path d="M104 92h32l-2 20a5 5 0 0 1-5 4h-18a5 5 0 0 1-5-4Z" fill={fur} />
        <path d="M100 92h40" />
        <path d="M109 104c4 1.5 18 1.5 22 0" opacity=".45" />
        {/* 방울 */}
        <path d="M120 86c-1.4 2-2 3.3-2 4.3a2 2 0 0 0 4 0c0-1-.6-2.3-2-4.3Z" fill="currentColor" stroke="none" opacity=".7" />
        {/* 김 */}
        <path d="M114 54c-2-3 2-5 0-8M122 54c-2-3 2-5 0-8" opacity=".5" />
      </g>
      {/* 시로의 손이 드리퍼 손잡이를 잡는다 */}
      <ellipse cx="100" cy="88" rx="7" ry="3.5" fill={fur} stroke={line} strokeWidth="1.2" />
      {/* 발자국 — 시로가 걸어온 자리 */}
      <g fill="currentColor" opacity=".35">
        <g transform="translate(10 112) scale(.5)">
          <circle cx="7" cy="9.5" r="4.2" />
          <circle cx="2.5" cy="4.8" r="2.1" />
          <circle cx="7" cy="2.5" r="2.1" />
          <circle cx="11.5" cy="4.8" r="2.1" />
        </g>
        <g transform="translate(24 120) scale(.5) rotate(10)">
          <circle cx="7" cy="9.5" r="4.2" />
          <circle cx="2.5" cy="4.8" r="2.1" />
          <circle cx="7" cy="2.5" r="2.1" />
          <circle cx="11.5" cy="4.8" r="2.1" />
        </g>
      </g>
    </svg>
  );
}
