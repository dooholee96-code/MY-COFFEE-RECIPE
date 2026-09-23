import type { PourFlow, PourPattern, PourTechnique } from '../types';
import { describePour, pourCycleSec } from '../lib/pour';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface Props {
  pour: PourTechnique;
  size?: number;
  /** false 면 항상 정지된 그림 (단계 표처럼 여러 개가 늘어서는 곳) */
  animate?: boolean;
  className?: string;
}

/** 물줄기 굵기 → 선 두께 (viewBox 100 기준) */
const FLOW_WIDTH: Record<PourFlow, number> = { thin: 2, medium: 3.6, thick: 5.6 };

const C = 50; // 중심

/** 위에서 본 궤적. 레시피가 말하는 모양 그대로 */
function patternPath(pattern: PourPattern): string {
  const circle = (r: number) => `M${C + r},${C} A${r},${r} 0 1,1 ${C - r},${C} A${r},${r} 0 1,1 ${C + r},${C}`;
  switch (pattern) {
    case 'center':
    case 'fill':
      return `M${C},${C} L${C + 0.01},${C}`;
    case 'small-circle':
      return circle(11);
    case 'large-circle':
      return circle(25);
    case 'spiral': {
      // 중심에서 가장자리로 나갔다가 다시 들어오는 나선 (카스야 4:6 설명 그대로)
      const turns = 2.5;
      const maxR = 27;
      const pts: string[] = [];
      const N = 90;
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const a = t * turns * 2 * Math.PI;
        pts.push(`${(C + maxR * t * Math.cos(a)).toFixed(2)},${(C + maxR * t * Math.sin(a)).toFixed(2)}`);
      }
      const back = [...pts].reverse().slice(1);
      return `M${pts[0]} L${[...pts.slice(1), ...back].join(' L')}`;
    }
  }
}

/** 궤적의 시작점 — 정지 그림에서 물줄기 점을 둘 자리 */
function patternStart(pattern: PourPattern): [number, number] {
  switch (pattern) {
    case 'small-circle':
      return [C + 11, C];
    case 'large-circle':
      return [C + 25, C];
    default:
      return [C, C];
  }
}

/**
 * 붓는 방식을 움직이는 그림으로.
 * - 궤적(pattern)이 있으면: 드리퍼를 위에서 본 모습 + 물줄기 점이 궤적을 따라 돈다.
 * - 굵기·속도만 있으면: 옆에서 본 모습 + 주전자에서 떨어지는 물줄기.
 * 점과 선의 굵기가 유량, 도는 속도가 붓는 속도다.
 */
export function PourGlyph({ pour, size = 72, animate = true, className = '' }: Props) {
  const reduced = useReducedMotion();
  const moving = animate && !reduced;
  const label = describePour(pour);
  const width = pour.flow ? FLOW_WIDTH[pour.flow] : 3.2;
  const cycle = pourCycleSec(pour);
  const dur = `${cycle}s`;

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      className={`shrink-0 ${className}`}
    >
      {pour.pattern ? <TopView pattern={pour.pattern} width={width} dur={dur} moving={moving} /> : <SideView width={width} cycle={cycle} moving={moving} />}
      {pour.agitation && <Agitation kind={pour.agitation} moving={moving} topView={Boolean(pour.pattern)} />}
    </svg>
  );
}

function TopView({ pattern, width, dur, moving }: { pattern: PourPattern; width: number; dur: string; moving: boolean }) {
  const d = patternPath(pattern);
  const dot = width * 0.8 + 1.6;
  const still = pattern === 'center' || pattern === 'fill';
  const [sx, sy] = patternStart(pattern);

  return (
    <g>
      {/* 드리퍼 테두리와 커피 베드 */}
      <circle cx={C} cy={C} r={44} className="stroke-line-strong" fill="none" strokeWidth={2} />
      <circle cx={C} cy={C} r={38} className="fill-ink" fillOpacity={0.1} />

      {pattern === 'fill' && (
        // 가득 채우기 — 물이 가장자리까지 차오른다
        <circle cx={C} cy={C} r={moving ? 12 : 34} className="fill-crema" fillOpacity={0.22}>
          {moving && <animate attributeName="r" values="10;36;36" keyTimes="0;0.8;1" dur={dur} repeatCount="indefinite" />}
        </circle>
      )}

      {!still && (
        // 궤적 — 흐릿한 길 위로 지나간 자리가 진해진다
        <>
          <path d={d} fill="none" className="stroke-crema" strokeOpacity={0.18} strokeWidth={width} strokeLinecap="round" />
          <path
            d={d}
            fill="none"
            className="stroke-crema"
            strokeOpacity={moving ? 0.6 : 0.5}
            strokeWidth={width}
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={moving ? '22 78' : undefined}
          >
            {moving && <animate attributeName="stroke-dashoffset" from="22" to="-78" dur={dur} repeatCount="indefinite" />}
          </path>
        </>
      )}

      {pattern === 'center' &&
        [0, 1].map((i) => (
          // 센터 푸어 — 한 점에 부어 물결이 번진다
          <circle key={i} cx={C} cy={C} r={moving ? 4 : 10 + i * 10} fill="none" className="stroke-crema" strokeWidth={1.5} strokeOpacity={moving ? 0.6 : 0.35}>
            {moving && (
              <>
                <animate attributeName="r" values="4;26" dur={dur} begin={`${i * 0.5}s`} repeatCount="indefinite" />
                <animate attributeName="stroke-opacity" values="0.7;0" dur={dur} begin={`${i * 0.5}s`} repeatCount="indefinite" />
              </>
            )}
          </circle>
        ))}

      {/* 물줄기가 닿는 점 */}
      {!still && moving ? (
        // 움직일 때는 점을 원점에 두고 animateMotion 이 궤적 좌표로 옮긴다
        <g>
          <circle r={dot * 1.9} className="fill-crema" fillOpacity={0.2} />
          <circle r={dot} className="fill-crema" />
          <animateMotion dur={dur} repeatCount="indefinite" path={d} />
        </g>
      ) : (
        <g>
          <circle cx={sx} cy={sy} r={dot * 1.9} className="fill-crema" fillOpacity={0.2} />
          <circle cx={sx} cy={sy} r={dot} className="fill-crema" />
        </g>
      )}
    </g>
  );
}

function SideView({ width, cycle, moving }: { width: number; cycle: number; moving: boolean }) {
  // SMIL 의 dur 는 calc() 를 받지 않는다 — 숫자로 계산해 넘긴다
  const dur = `${cycle}s`;
  const fall = `${Math.round((cycle / 5) * 100) / 100}s`;
  return (
    <g>
      {/* 주전자 주둥이 */}
      <path d="M14 14 Q30 12 44 19" fill="none" className="stroke-ink-soft" strokeWidth={3} strokeLinecap="round" />
      {/* 물줄기 — 두께가 유량, 떨어지는 속도가 붓는 속도 */}
      <path d="M45 21 Q50 30 50 52" fill="none" className="stroke-crema" strokeOpacity={0.25} strokeWidth={width} strokeLinecap="round" />
      <path
        d="M45 21 Q50 30 50 52"
        fill="none"
        className="stroke-crema"
        strokeWidth={width}
        strokeLinecap="round"
        strokeDasharray={moving ? '5 6' : undefined}
      >
        {moving && <animate attributeName="stroke-dashoffset" from="11" to="0" dur={fall} repeatCount="indefinite" />}
      </path>
      {/* 드리퍼(원뿔) 와 커피 베드 */}
      <path d="M22 50 H78 L58 84 H42 Z" fill="none" className="stroke-line-strong" strokeWidth={2.4} strokeLinejoin="round" />
      <path d="M31 65 H69 L58 84 H42 Z" className="fill-ink" fillOpacity={0.14} />
      {/* 떨어지는 방울 */}
      <circle cx={50} cy={90} r={2.2} className="fill-crema" opacity={moving ? 0 : 0.6}>
        {moving && (
          <>
            <animate attributeName="cy" values="86;96" dur={dur} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;0.8;0" dur={dur} repeatCount="indefinite" />
          </>
        )}
      </circle>
    </g>
  );
}

/** 교반(스푼으로 젓기) / 스월링(드리퍼째 돌리기) — 도는 화살표 */
function Agitation({ kind, moving, topView }: { kind: 'stir' | 'swirl'; moving: boolean; topView: boolean }) {
  const cx = C;
  const cy = topView ? C : 68;
  const r = kind === 'swirl' ? 16 : 10;
  return (
    <g className="text-ink-soft">
      <g>
        <path
          d={`M${cx + r},${cy} A${r},${r} 0 1,1 ${cx},${cy - r}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
        />
        <path d={`M${cx - 4},${cy - r - 4} L${cx},${cy - r} L${cx - 4},${cy - r + 4}`} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        {moving && (
          <animateTransform attributeName="transform" type="rotate" from={`0 ${cx} ${cy}`} to={`360 ${cx} ${cy}`} dur={kind === 'swirl' ? '2.4s' : '1.4s'} repeatCount="indefinite" />
        )}
      </g>
    </g>
  );
}
