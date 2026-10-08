import { useId } from 'react';
import type { MascotCharacter, MascotFaceProps, MascotFigureProps, MascotPose } from '../types';

/**
 * 아기 토끼 시로 — shirolee studio 의 토끼. 빅 히스토리 연표·출석부 앱과 같은 납작한 타원 그림이다.
 * 여기서는 바리스타: 앞치마를 두르고 구스넥 주전자로 V60 에 붓는다.
 *
 * 색은 테마 토큰만 쓴다 — 털·윤곽·볼은 `fur`·`fur-line`·`blush`(시로 전용), 장면의 사물은 `ill-*`.
 * 밤 테마에서도 같은 얼굴이다. 얼굴(`Face`)은 연표 앱의 시로 얼굴과 같은 좌표다.
 *
 * 좌표는 viewBox 160×120. 시로는 왼쪽(x 20~66)에 앉아 있고, 드리퍼와 서버는 오른쪽(x 114~158), 모두 나무 탁자(y 108)
 * 위. 주전자는 손(83,70)을 축으로 기울인다. 주둥이 끝은 (133,57) — 드리퍼 림(y 64) 위. 붓지 않는 자세에서는
 * 주전자를 뒤로 젖혀 주둥이가 드리퍼 위를 벗어난다.
 *
 * 움직임은 전부 SMIL 이고 `moving` 이 false 면 하나도 넣지 않는다 (일시정지·동작 줄이기에 완전히 멈춘다).
 */

const HAND: [number, number] = [83, 70];
const SHOULDER: [number, number] = [62, 86];

/** 자세별 각도. 양수 = 시계 방향(내려감) */
const ARM_ANGLE: Record<MascotPose, number> = { idle: 4, pour: 0, wait: 6, done: 10 };
const KETTLE_ANGLE: Record<MascotPose, number> = { idle: -18, pour: 0, wait: -18, done: -25 };

const FUR = 'var(--color-fur)';
const FUR_LINE = 'var(--color-fur-line)';
const BLUSH = 'var(--color-blush)';
const INK = 'var(--color-ink)';
const LINE = 'var(--color-ill-line)';
const APRON = 'var(--color-ill-apron)';
const SCARF = 'var(--color-ill-scarf)';
const KETTLE = 'var(--color-ill-kettle)';
const WATER = 'var(--color-ill-water)';
const WATER_SOFT = 'var(--color-ill-water-soft)';
const COFFEE = 'var(--color-ill-coffee)';
const BED = 'var(--color-ill-coffee-soft)';
const WOOD = 'var(--color-ill-wood)';
const GLASS = 'var(--color-ill-glass)';
const SPARK = 'var(--color-carrot)';

/** 부드러운 들어갔다 나오는 가속 */
const EASE = '.42 0 .58 1';

/** 통통한 팔 — 윤곽선 굵기로 한 번, 털색으로 한 번 */
function Arm({ d }: { d: string }) {
  return (
    <>
      <path d={d} stroke={FUR_LINE} strokeWidth="8" />
      <path d={d} stroke={FUR} strokeWidth="5" />
    </>
  );
}

function Sparkle({ x, y, s, begin }: { x: number; y: number; s: number; begin: string }) {
  return (
    <path
      d={`M${x} ${y - s} Q${x} ${y} ${x + s} ${y} Q${x} ${y} ${x} ${y + s} Q${x} ${y} ${x - s} ${y} Q${x} ${y} ${x} ${y - s}Z`}
      fill={SPARK}
      stroke="none"
      opacity="0"
    >
      <animate attributeName="opacity" values="0;1;0" dur="1.6s" begin={begin} repeatCount="indefinite" />
    </path>
  );
}

function Figure({ pose, moving, className = '' }: MascotFigureProps) {
  const pouring = pose === 'pour';
  const brewed = pose !== 'idle';
  const done = pose === 'done';
  const clipId = useId();

  return (
    <svg
      viewBox="0 0 160 120"
      fill="none"
      stroke={LINE}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`block h-auto w-full ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* 서버 안쪽 — 커피가 차오르는 영역 */}
        <clipPath id={clipId}>
          <path d="M118 90h30l-2 16a4 4 0 0 1-4 4h-18a4 4 0 0 1-4-4Z" />
        </clipPath>
      </defs>

      {/* ── 나무 탁자 ── */}
      <rect x="8" y="108" width="144" height="7" rx="3.5" fill={WOOD} stroke="none" />
      <path d="M20 111.5h30M60 111.5h14M100 111.5h40" stroke={LINE} strokeOpacity=".18" strokeWidth="1.4" />

      {/* ── 서버 + 드리퍼 (시로보다 먼저 — 주전자가 위에 얹힌다) ── */}
      <g>
        <path d="M118 90h30l-2 16a4 4 0 0 1-4 4h-18a4 4 0 0 1-4-4Z" fill={GLASS} stroke="none" />
        {brewed && (
          <g clipPath={`url(#${clipId})`} stroke="none">
            <rect x="116" y={done ? 96 : 102} width="34" height="16" fill={COFFEE} />
            <ellipse cx="133" cy={done ? 96 : 102} rx="14" ry="1.6" fill={COFFEE} opacity=".7" />
          </g>
        )}
        <path d="M118 90h30l-2 16a4 4 0 0 1-4 4h-18a4 4 0 0 1-4-4Z" />
        <path d="M148 92c6 0 7 4 6 8-1 3-3 4-5 4" />
        <path d="M114 64h38l-14 22h-10Z" fill={GLASS} stroke="none" />
        <path d="M121 75h24l-7 11h-10Z" fill={BED} stroke="none" />
        <path d="M114 64h38l-14 22h-10Z" />
        <path d="M110 64h46" />
        {brewed && <ellipse cx="133" cy="72" rx="12" ry="2" fill={WATER_SOFT} stroke={WATER} strokeWidth="1.2" />}
        {pouring && moving && (
          <>
            <ellipse cx="133" cy="72" rx="2" ry=".6" stroke={WATER} strokeWidth="1.3" opacity="0">
              <animate attributeName="rx" values="2;11" dur="1.2s" repeatCount="indefinite" />
              <animate attributeName="ry" values=".4;1.8" dur="1.2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values=".9;0" dur="1.2s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="133" cy="72" rx="2" ry=".6" stroke={WATER} strokeWidth="1.3" opacity="0">
              <animate attributeName="rx" values="2;11" dur="1.2s" begin=".6s" repeatCount="indefinite" />
              <animate attributeName="ry" values=".4;1.8" dur="1.2s" begin=".6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values=".9;0" dur="1.2s" begin=".6s" repeatCount="indefinite" />
            </ellipse>
          </>
        )}
        {brewed && !done && (
          <>
            <circle cx="133" cy="89" r="1.6" fill={COFFEE} stroke="none" opacity={moving ? 1 : 0.8}>
              {moving && (
                <>
                  <animate attributeName="cy" values="88;101" dur="1s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;1;0" keyTimes="0;.75;1" dur="1s" repeatCount="indefinite" />
                </>
              )}
            </circle>
            {moving && (
              <circle cx="133" cy="89" r="1.6" fill={COFFEE} stroke="none" opacity="0">
                <animate attributeName="cy" values="88;101" dur="1s" begin=".5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;1;0" keyTimes="0;.75;1" dur="1s" begin=".5s" repeatCount="indefinite" />
              </circle>
            )}
          </>
        )}
        {/* 향 — 내리는 동안 드리퍼 옆에서 피어오르는 김 */}
        {brewed && moving && (
          <g stroke={LINE} strokeOpacity=".35" strokeWidth="1.5">
            <path d="M106 60c-2-3 2-5 0-8">
              <animate attributeName="opacity" values="0;1;0" dur="2.4s" repeatCount="indefinite" />
              <animateTransform attributeName="transform" type="translate" values="0 0;0 -4" dur="2.4s" repeatCount="indefinite" />
            </path>
            <path d="M158 58c-2-3 2-5 0-8">
              <animate attributeName="opacity" values="0;1;0" dur="2.4s" begin="1.1s" repeatCount="indefinite" />
              <animateTransform attributeName="transform" type="translate" values="0 0;0 -4" dur="2.4s" begin="1.1s" repeatCount="indefinite" />
            </path>
          </g>
        )}
      </g>

      {/* ── 시로 ── */}
      <g stroke={FUR_LINE} strokeWidth="1.5">
        {moving && (
          // 완료면 통통 뛰고, 아니면 가만히 숨쉰다
          <animateTransform
            attributeName="transform"
            type="translate"
            values={done ? '0 0;0 -5;0 0' : '0 0;0 -1;0 0'}
            keyTimes="0;.5;1"
            calcMode="spline"
            keySplines={`${EASE};${EASE}`}
            dur={done ? '.8s' : '3.2s'}
            repeatCount="indefinite"
          />
        )}
        {/* 꼬리 */}
        <circle cx="25" cy="100" r="4.5" fill={FUR} />
        {/* 귀 — 연표의 시로와 같은 비율 */}
        <g>
          {moving && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              values={done ? '0 36 50;-16 36 50;0 36 50' : '0 36 50;-7 36 50;0 36 50;0 36 50'}
              keyTimes={done ? '0;.5;1' : '0;.08;.16;1'}
              calcMode="spline"
              keySplines={done ? `${EASE};${EASE}` : `${EASE};${EASE};${EASE}`}
              dur={done ? '.8s' : '5s'}
              repeatCount="indefinite"
            />
          )}
          <ellipse cx="36" cy="38" rx="5.5" ry="15.5" transform="rotate(-8 36 38)" fill={FUR} />
          <ellipse cx="36" cy="39.5" rx="2.4" ry="9.8" transform="rotate(-8 36 39.5)" fill={BLUSH} stroke="none" />
        </g>
        <g>
          {done && moving && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="0 54 50;16 54 50;0 54 50"
              keyTimes="0;.5;1"
              calcMode="spline"
              keySplines={`${EASE};${EASE}`}
              dur=".8s"
              repeatCount="indefinite"
            />
          )}
          <ellipse cx="54" cy="38" rx="5.5" ry="15.5" transform="rotate(8 54 38)" fill={FUR} />
          <ellipse cx="54" cy="39.5" rx="2.4" ry="9.8" transform="rotate(8 54 39.5)" fill={BLUSH} stroke="none" />
        </g>
        {/* 몸 — 앉아 있는 납작한 타원. 앞치마와 발 */}
        <ellipse cx="45" cy="92" rx="21" ry="16" fill={FUR} />
        <path d="M34 86h22l2 20H32Z" fill={APRON} />
        <path d="M37 86l1-6M53 86l-1-6" />
        <path d="M41 98h8" strokeOpacity=".5" />
        <ellipse cx="34" cy="106.5" rx="6.5" ry="3" fill={FUR} />
        <ellipse cx="56" cy="106.5" rx="6.5" ry="3" fill={FUR} />
        {/* 머리 */}
        <circle cx="45" cy="58" r="18" fill={FUR} />
        {/* 목에 두른 수건 — 머리와 몸의 이음새를 덮는다 */}
        <path d="M37 74l8 8 8-8c-5 2.6-11 2.6-16 0Z" fill={SCARF} />
        {/* 볼 */}
        <circle cx="32" cy="63.5" r="3.8" fill={BLUSH} stroke="none" />
        <circle cx="58" cy="63.5" r="3.8" fill={BLUSH} stroke="none" />
        {/* 눈 — 완료는 웃는 눈 */}
        {done ? (
          <path d="M35.5 57q2.2-2.8 4.4 0M50.1 57q2.2-2.8 4.4 0" stroke={INK} strokeWidth="2" />
        ) : (
          <>
            <ellipse cx="37.4" cy="56.6" rx="2.1" ry="2.1" fill={INK} stroke="none">
              {moving && <animate attributeName="ry" values="2.1;2.1;.2;2.1" keyTimes="0;.9;.94;1" dur="4.2s" repeatCount="indefinite" />}
            </ellipse>
            <ellipse cx="52.6" cy="56.6" rx="2.1" ry="2.1" fill={INK} stroke="none">
              {moving && <animate attributeName="ry" values="2.1;2.1;.2;2.1" keyTimes="0;.9;.94;1" dur="4.2s" repeatCount="indefinite" />}
            </ellipse>
          </>
        )}
        {/* 입 */}
        <path d="M42.2 63.5q2.8 2.8 5.6 0" stroke={INK} strokeWidth="2" />

        {/* 왼팔 — 완료면 잔을 들어 올린다 */}
        {done ? (
          <g>
            <Arm d="M30 90C24 86 20 78 24 72" />
            <ellipse cx="23" cy="70" rx="4.5" ry="3.2" fill={FUR} />
            <g stroke={LINE} strokeWidth="2">
              <path d="M13 60h14l-1.6 9h-10.8Z" fill="var(--color-card)" />
              <ellipse cx="20" cy="60" rx="6.2" ry="1.4" fill={COFFEE} stroke="none" />
              <path d="M27 62c3.5 0 3.5 5.5 0 5.5" />
              <path d="M17 54c-1.5-2 1.5-3.5 0-6M23 54c-1.5-2 1.5-3.5 0-6" strokeOpacity=".45">
                {moving && <animate attributeName="opacity" values=".3;1;.3" dur="1.8s" repeatCount="indefinite" />}
              </path>
            </g>
            {moving && (
              <>
                <Sparkle x={68} y={44} s={3} begin="0s" />
                <Sparkle x={26} y={40} s={2.4} begin=".5s" />
                <Sparkle x={72} y={60} s={2} begin="1s" />
              </>
            )}
          </g>
        ) : (
          <g>
            <Arm d="M30 92c-6 2-9 8-6 13" />
            <ellipse cx="25" cy="105" rx="4.5" ry="3" fill={FUR} />
          </g>
        )}

        {/* 오른팔 + 주전자 */}
        <g transform={`rotate(${ARM_ANGLE[pose]} ${SHOULDER[0]} ${SHOULDER[1]})`}>
          <Arm d="M62 86c7-4 14-10 21-16" />
          <g transform={`rotate(${KETTLE_ANGLE[pose]} ${HAND[0]} ${HAND[1]})`} stroke={LINE} strokeWidth="2">
            {pouring && moving && (
              <animateTransform
                attributeName="transform"
                type="rotate"
                additive="sum"
                values={`0 ${HAND[0]} ${HAND[1]};-2.5 ${HAND[0]} ${HAND[1]};0 ${HAND[0]} ${HAND[1]};2.5 ${HAND[0]} ${HAND[1]};0 ${HAND[0]} ${HAND[1]}`}
                calcMode="spline"
                keySplines={`${EASE};${EASE};${EASE};${EASE}`}
                dur="2.4s"
                repeatCount="indefinite"
              />
            )}
            <path d="M90 64c-8-1-8 13 0 12" />
            <path d="M90 62h18l3 16H87Z" fill={KETTLE} />
            <path d="M91 62c3-6 13-6 16 0" fill={KETTLE} />
            <circle cx="99" cy="56.5" r="1.5" fill={LINE} stroke="none" />
            <path d="M108 66c8-1 14-4 18-9 3-4 7-3.5 7 0" />
            {pouring && (
              <path d="M133 58v13" stroke={WATER} strokeWidth="2.4" strokeDasharray="4 3" opacity=".9">
                {moving && <animate attributeName="stroke-dashoffset" values="0;-7" dur=".35s" repeatCount="indefinite" />}
              </path>
            )}
          </g>
          <ellipse cx={HAND[0]} cy={HAND[1]} rx="4.8" ry="3.4" transform={`rotate(-35 ${HAND[0]} ${HAND[1]})`} fill={FUR} />
        </g>
      </g>
    </svg>
  );
}

/** 귀·얼굴만 — 헤더의 마크. 연표 앱의 시로 얼굴과 같은 좌표 */
function Face({ className = '' }: MascotFaceProps) {
  return (
    <svg viewBox="20 2 80 80" className={`block h-auto w-full ${className}`} aria-hidden="true" focusable="false">
      <ellipse cx="47" cy="30" rx="8" ry="22" transform="rotate(-8 47 30)" fill={FUR} stroke={FUR_LINE} strokeWidth="1.5" />
      <ellipse cx="47" cy="32" rx="3.5" ry="14" transform="rotate(-8 47 32)" fill={BLUSH} />
      <ellipse cx="73" cy="30" rx="8" ry="22" transform="rotate(8 73 30)" fill={FUR} stroke={FUR_LINE} strokeWidth="1.5" />
      <ellipse cx="73" cy="32" rx="3.5" ry="14" transform="rotate(8 73 32)" fill={BLUSH} />
      <circle cx="60" cy="56" r="26" fill={FUR} stroke={FUR_LINE} strokeWidth="1.5" />
      <circle cx="49" cy="54" r="3" fill={INK} />
      <circle cx="71" cy="54" r="3" fill={INK} />
      <circle cx="41" cy="64" r="5.5" fill={BLUSH} />
      <circle cx="79" cy="64" r="5.5" fill={BLUSH} />
      <path d="M56 64q4 4 8 0" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** 시로의 손 — 납작한 타원 */
function Paw({ x, y, rx, ry, rotate = 0 }: { x: number; y: number; rx: number; ry: number; rotate?: number }) {
  return <ellipse cx={x} cy={y} rx={rx} ry={ry} transform={`rotate(${rotate} ${x} ${y})`} fill={FUR} stroke={FUR_LINE} strokeWidth="1.5" />;
}

/** 1인칭: 위에서 내려다본 구스넥 주전자와 그걸 쥔 손. 원점이 주둥이 끝 */
function PovKettle() {
  return (
    <g fill="none" stroke={LINE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M25 29c5 4 8 7 11 11" />
      <circle cx="18" cy="21" r="10.5" fill={KETTLE} />
      <circle cx="18" cy="21" r="5.5" strokeOpacity=".45" />
      <circle cx="18" cy="21" r="1.8" fill={LINE} stroke="none" />
      <path d="M11 14C8 10 4 5 0 0" strokeWidth="2.6" />
      <Paw x={39} y={43} rx={8} ry={5.2} rotate={40} />
    </g>
  );
}

/** 1인칭: 드리퍼 옆에 놓인 다른 손과 팔 */
function PovRest() {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 92v8" stroke={FUR_LINE} strokeWidth="12" />
      <path d="M16 92v8" stroke={FUR} strokeWidth="9" />
      <Paw x={16} y={88} rx={9.5} ry={5.5} />
    </g>
  );
}

export const shiro: MascotCharacter = {
  id: 'shiro',
  name: '아기 토끼 시로 (shirolee studio)',
  Figure,
  Face,
  Pov: { Kettle: PovKettle, Rest: PovRest },
};
