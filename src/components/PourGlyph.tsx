import type { PourFlow, PourPattern, PourTechnique } from '../types';
import { describePour, pourCycleSec } from '../lib/pour';
import { useAnimatePours } from '../hooks/usePourMotion';

interface Props {
  pour: PourTechnique;
  size?: number;
  /** false 면 항상 정지된 그림 */
  animate?: boolean;
  className?: string;
}

/** 물줄기 굵기 → 선 두께 (viewBox 100 기준) */
const FLOW_WIDTH: Record<PourFlow, number> = { thin: 2, medium: 3.8, thick: 6 };

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
 * 붓는 방식을 짧게 반복되는 애니메이션으로.
 * - 궤적(pattern)이 있으면: 드리퍼를 위에서 본 모습. 물이 닿는 점이 궤적을 따라 돌고, 닿는 자리에 물결이 인다.
 * - 굵기·속도만 있으면: 옆에서 본 모습. 주전자에서 물줄기와 물방울이 떨어진다.
 * 점·선의 굵기가 유량, 도는/떨어지는 속도가 붓는 속도다.
 */
export function PourGlyph({ pour, size = 72, animate = true, className = '' }: Props) {
  const allowMotion = useAnimatePours();
  const moving = animate && allowMotion;
  const label = describePour(pour);
  const width = pour.flow ? FLOW_WIDTH[pour.flow] : 3.4;
  const cycle = pourCycleSec(pour);

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={label} className={`shrink-0 ${className}`}>
      {pour.pattern ? (
        <TopView pattern={pour.pattern} width={width} cycle={cycle} moving={moving} />
      ) : (
        <SideView width={width} cycle={cycle} moving={moving} />
      )}
      {pour.agitation && <Agitation kind={pour.agitation} moving={moving} topView={Boolean(pour.pattern)} />}
    </svg>
  );
}

/** 물이 닿는 자리에서 번지는 물결 한 겹 */
function Ripple({ r0, r1, dur, begin = 0, moving }: { r0: number; r1: number; dur: number; begin?: number; moving: boolean }) {
  if (!moving) return null;
  return (
    <circle r={r0} fill="none" className="stroke-crema" strokeWidth={1.4}>
      <animate attributeName="r" values={`${r0};${r1}`} dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" />
      <animate attributeName="stroke-opacity" values="0.8;0" dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" />
    </circle>
  );
}

function TopView({ pattern, width, cycle, moving }: { pattern: PourPattern; width: number; cycle: number; moving: boolean }) {
  const d = patternPath(pattern);
  const dur = `${cycle}s`;
  const dot = width * 0.8 + 1.8;
  const still = pattern === 'center' || pattern === 'fill';
  const [sx, sy] = patternStart(pattern);
  // 물결 주기 — 붓는 속도를 따라간다 (빠를수록 자주)
  const rippleDur = Math.max(0.5, Math.round((cycle / 3.3) * 100) / 100);

  return (
    <g>
      {/* 드리퍼 테두리와 커피 베드 */}
      <circle cx={C} cy={C} r={45} className="stroke-line-strong" fill="none" strokeWidth={2} />
      <circle cx={C} cy={C} r={39} className="fill-ink" fillOpacity={0.1} />

      {pattern === 'fill' && (
        // 가득 채우기 — 물이 가장자리까지 차오른다
        <circle cx={C} cy={C} r={moving ? 12 : 34} className="fill-crema" fillOpacity={0.24}>
          {moving && <animate attributeName="r" values="10;37;37" keyTimes="0;0.8;1" dur={dur} repeatCount="indefinite" />}
        </circle>
      )}

      {!still && (
        // 궤적 — 흐릿한 길 위로 물줄기가 지나간 자리가 진해진다
        <>
          <path d={d} fill="none" className="stroke-crema" strokeOpacity={0.16} strokeWidth={width} strokeLinecap="round" />
          <path
            d={d}
            fill="none"
            className="stroke-crema"
            strokeOpacity={moving ? 0.65 : 0.5}
            strokeWidth={width}
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={moving ? '24 76' : undefined}
          >
            {moving && <animate attributeName="stroke-dashoffset" from="24" to="-76" dur={dur} repeatCount="indefinite" />}
          </path>
        </>
      )}

      {still ? (
        // 센터 푸어 / 가득 채우기 — 한 점에 부어 물결이 번진다
        <g transform={`translate(${C} ${C})`}>
          {!moving && [12, 22].map((r) => <circle key={r} r={r} fill="none" className="stroke-crema" strokeWidth={1.4} strokeOpacity={0.35} />)}
          <Ripple r0={dot} r1={28} dur={cycle / 1.5} moving={moving} />
          <Ripple r0={dot} r1={28} dur={cycle / 1.5} begin={cycle / 3} moving={moving} />
          <circle r={dot * 1.9} className="fill-crema" fillOpacity={0.2} />
          <circle r={dot} className="fill-crema" />
        </g>
      ) : moving ? (
        // 움직일 때는 점을 원점에 두고 animateMotion 이 궤적 좌표로 옮긴다 — 물결도 점을 따라간다
        <g>
          <Ripple r0={dot} r1={dot * 3.4} dur={rippleDur} moving />
          <circle r={dot * 1.9} className="fill-crema" fillOpacity={0.22} />
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

const STREAM = 'M45 21 Q50 30 50 56';

function SideView({ width, cycle, moving }: { width: number; cycle: number; moving: boolean }) {
  // SMIL 의 dur 는 calc() 를 받지 않는다 — 숫자로 계산해 넘긴다
  const fall = Math.max(0.35, Math.round((cycle / 4) * 100) / 100);
  const drop = Math.max(1.6, width * 0.55);
  return (
    <g>
      {/* 주전자 주둥이 */}
      <path d="M12 13 Q30 11 44 19" fill="none" className="stroke-ink-soft" strokeWidth={3.2} strokeLinecap="round" />
      {/* 물줄기 — 두께가 유량 */}
      <path d={STREAM} fill="none" className="stroke-crema" strokeOpacity={0.28} strokeWidth={width} strokeLinecap="round" />
      <path d={STREAM} fill="none" className="stroke-crema" strokeWidth={width} strokeLinecap="round" strokeDasharray={moving ? '6 7' : undefined}>
        {moving && <animate attributeName="stroke-dashoffset" from="13" to="0" dur={`${fall}s`} repeatCount="indefinite" />}
      </path>
      {/* 떨어지는 물방울 — 떨어지는 속도가 붓는 속도 */}
      {moving &&
        [0, 1, 2].map((i) => (
          <circle key={i} r={drop} className="fill-crema">
            <animateMotion dur={`${fall * 1.6}s`} begin={`${-(i * fall * 1.6) / 3}s`} repeatCount="indefinite" path={STREAM} />
          </circle>
        ))}
      {/* 드리퍼(원뿔)와 커피 베드 — 물이 닿는 자리에 물결 */}
      <path d="M20 50 H80 L59 86 H41 Z" fill="none" className="stroke-line-strong" strokeWidth={2.4} strokeLinejoin="round" />
      <path d="M29 64 H71 L59 86 H41 Z" className="fill-ink" fillOpacity={0.14} />
      {moving && (
        <ellipse cx={50} cy={64} rx={3} ry={1.2} fill="none" className="stroke-crema" strokeWidth={1.3}>
          <animate attributeName="rx" values="3;19" dur={`${fall * 2}s`} repeatCount="indefinite" />
          <animate attributeName="ry" values="1.2;4" dur={`${fall * 2}s`} repeatCount="indefinite" />
          <animate attributeName="stroke-opacity" values="0.9;0" dur={`${fall * 2}s`} repeatCount="indefinite" />
        </ellipse>
      )}
      {/* 서버로 떨어지는 방울 */}
      <circle cx={50} cy={90} r={2.2} className="fill-crema" opacity={moving ? 0 : 0.6}>
        {moving && (
          <>
            <animate attributeName="cy" values="87;97" dur={`${cycle}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;0.85;0" dur={`${cycle}s`} repeatCount="indefinite" />
          </>
        )}
      </circle>
    </g>
  );
}

/** 교반(스푼으로 젓기) / 스월링(드리퍼째 돌리기) — 도는 화살표 */
function Agitation({ kind, moving, topView }: { kind: 'stir' | 'swirl'; moving: boolean; topView: boolean }) {
  const cx = C;
  const cy = topView ? C : 73;
  const r = kind === 'swirl' ? 16 : 9;
  return (
    <g className="text-ink-soft">
      <g>
        <path d={`M${cx + r},${cy} A${r},${r} 0 1,1 ${cx},${cy - r}`} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" />
        <path
          d={`M${cx - 4},${cy - r - 4} L${cx},${cy - r} L${cx - 4},${cy - r + 4}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {moving && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            from={`0 ${cx} ${cy}`}
            to={`360 ${cx} ${cy}`}
            dur={kind === 'swirl' ? '2.4s' : '1.2s'}
            repeatCount="indefinite"
          />
        )}
      </g>
    </g>
  );
}
