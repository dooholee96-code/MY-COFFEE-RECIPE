import { useId } from 'react';
import type { MascotCharacter, MascotFaceProps, MascotFigureProps, MascotPose } from '../types';

/**
 * 바리스타 토끼 — 자리표시 캐릭터, 동화책 풍.
 *
 * 색은 `index.css` 의 일러스트 토큰(`--color-ill-*`)만 쓴다: 크림색 털, 분홍 귀와 볼, 테라코타 앞치마,
 * 하늘빛 물, 갈색 커피, 나무 탁자. 외곽선은 `ill-line` — 잉크보다 부드럽다. 정식 캐릭터 디자인이
 * 나오면 이 파일을 그대로 두고 `characters/` 에 새 파일을 만들어 `ACTIVE_CHARACTER` 만 바꾼다.
 *
 * 좌표는 viewBox 160×120. 토끼는 왼쪽(x 20~64), 드리퍼와 서버는 오른쪽(x 114~158), 모두 나무 탁자(y 110) 위.
 * 주전자는 손(83,70)을 축으로 기울인다. 주둥이 끝은 (133,57) — 드리퍼 림(y 64) 위. 붓지 않는 자세에서는
 * 주전자를 뒤로 젖혀 주둥이가 드리퍼 위를 벗어난다 — 팔을 내리면 주둥이가 드리퍼에 박힌다.
 *
 * 움직임은 전부 SMIL 이고 `moving` 이 false 면 하나도 넣지 않는다 (일시정지·동작 줄이기에 완전히 멈춘다).
 * 통통 뛰기·숨쉬기는 keySplines 로 부드럽게.
 */

const HAND: [number, number] = [83, 70];
const SHOULDER: [number, number] = [60, 84];

/** 자세별 각도. 양수 = 시계 방향(내려감) */
const ARM_ANGLE: Record<MascotPose, number> = { idle: 4, pour: 0, wait: 6, done: 10 };
const KETTLE_ANGLE: Record<MascotPose, number> = { idle: -18, pour: 0, wait: -18, done: -25 };

const LINE = 'var(--color-ill-line)';
const FUR = 'var(--color-ill-fur)';
const EAR = 'var(--color-ill-ear)';
const BLUSH = 'var(--color-ill-blush)';
const APRON = 'var(--color-ill-apron)';
const SCARF = 'var(--color-ill-scarf)';
const KETTLE = 'var(--color-ill-kettle)';
const WATER = 'var(--color-ill-water)';
const WATER_SOFT = 'var(--color-ill-water-soft)';
const COFFEE = 'var(--color-ill-coffee)';
const BED = 'var(--color-ill-coffee-soft)';
const WOOD = 'var(--color-ill-wood)';
const GLASS = 'var(--color-ill-glass)';
const SPARK = 'var(--color-crema)';

/** 부드러운 들어갔다 나오는 가속 */
const EASE = '.42 0 .58 1';

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
      <rect x="8" y="110" width="144" height="7" rx="3.5" fill={WOOD} />
      <path d="M20 113.5h30M60 113.5h14M100 113.5h40" stroke={LINE} strokeOpacity=".18" strokeWidth="1.4" />

      {/* ── 서버 + 드리퍼 (토끼보다 먼저 — 주전자가 위에 얹힌다) ── */}
      <g>
        {/* 서버: 유리. 커피가 차 있는 만큼 갈색 */}
        <path d="M118 90h30l-2 16a4 4 0 0 1-4 4h-18a4 4 0 0 1-4-4Z" fill={GLASS} />
        {brewed && (
          <g clipPath={`url(#${clipId})`} stroke="none">
            <rect x="116" y={done ? 96 : 102} width="34" height="16" fill={COFFEE} />
            <ellipse cx="133" cy={done ? 96 : 102} rx="14" ry="1.6" fill={COFFEE} opacity=".7" />
          </g>
        )}
        <path d="M118 90h30l-2 16a4 4 0 0 1-4 4h-18a4 4 0 0 1-4-4Z" />
        <path d="M148 92c6 0 7 4 6 8-1 3-3 4-5 4" />
        {/* 드리퍼: 유리 원뿔에 커피 베드 */}
        <path d="M114 64h38l-14 22h-10Z" fill={GLASS} />
        <path d="M121 75h24l-7 11h-10Z" fill={BED} stroke="none" />
        <path d="M114 64h38l-14 22h-10Z" />
        <path d="M110 64h46" />
        {brewed && <ellipse cx="133" cy="72" rx="12" ry="2" fill={WATER_SOFT} stroke={WATER} strokeWidth="1.2" />}
        {/* 물결 — 붓는 동안 */}
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
        {/* 드리퍼에서 서버로 떨어지는 방울 */}
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

      {/* ── 토끼 ── */}
      <g>
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
        <circle cx="24" cy="97" r="4.5" fill={FUR} />
        {/* 귀 */}
        <g>
          {moving && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              values={done ? '0 38 46;-16 38 46;0 38 46' : '0 38 46;-7 38 46;0 38 46;0 38 46'}
              keyTimes={done ? '0;.5;1' : '0;.08;.16;1'}
              calcMode="spline"
              keySplines={done ? `${EASE};${EASE}` : `${EASE};${EASE};${EASE}`}
              dur={done ? '.8s' : '5s'}
              repeatCount="indefinite"
            />
          )}
          <ellipse cx="38" cy="32" rx="5.5" ry="15" fill={FUR} transform="rotate(-12 38 46)" />
          <ellipse cx="38" cy="33" rx="2.6" ry="10" fill={EAR} stroke="none" transform="rotate(-12 38 46)" />
        </g>
        <g>
          {done && moving && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="0 52 46;16 52 46;0 52 46"
              keyTimes="0;.5;1"
              calcMode="spline"
              keySplines={`${EASE};${EASE}`}
              dur=".8s"
              repeatCount="indefinite"
            />
          )}
          <ellipse cx="52" cy="32" rx="5.5" ry="15" fill={FUR} transform="rotate(12 52 46)" />
          <ellipse cx="52" cy="33" rx="2.6" ry="10" fill={EAR} stroke="none" transform="rotate(12 52 46)" />
        </g>
        {/* 몸 + 앞치마 + 발 */}
        <path d="M27 110C27 64 63 64 63 110Z" fill={FUR} />
        <path d="M37 84h16l3 26H34Z" fill={APRON} />
        <path d="M40 84l1-8M50 84l-1-8" />
        <path d="M41 97h8" strokeOpacity=".5" />
        <ellipse cx="38" cy="110" rx="6" ry="2.4" fill={FUR} />
        <ellipse cx="52" cy="110" rx="6" ry="2.4" fill={FUR} />
        {/* 머리 */}
        <circle cx="45" cy="56" r="15" fill={FUR} />
        {/* 목에 두른 수건 — 머리와 몸의 이음새를 덮는다 */}
        <path d="M37 70l8 9 8-9c-5 2.5-11 2.5-16 0Z" fill={SCARF} />
        {/* 볼 */}
        <circle cx="37" cy="59.5" r="2.8" fill={BLUSH} stroke="none" opacity=".75" />
        <circle cx="53" cy="59.5" r="2.8" fill={BLUSH} stroke="none" opacity=".75" />
        {/* 눈 — 완료는 웃는 눈 */}
        {done ? (
          <path d="M38 55.5q2-2.6 4 0M48 55.5q2-2.6 4 0" />
        ) : (
          <>
            <ellipse cx="40" cy="55" rx="1.7" ry="1.7" fill={LINE} stroke="none">
              {moving && <animate attributeName="ry" values="1.7;1.7;.2;1.7" keyTimes="0;.9;.94;1" dur="4.2s" repeatCount="indefinite" />}
            </ellipse>
            <ellipse cx="50" cy="55" rx="1.7" ry="1.7" fill={LINE} stroke="none">
              {moving && <animate attributeName="ry" values="1.7;1.7;.2;1.7" keyTimes="0;.9;.94;1" dur="4.2s" repeatCount="indefinite" />}
            </ellipse>
            {/* 눈빛 */}
            <circle cx="40.6" cy="54.4" r=".5" fill={FUR} stroke="none" />
            <circle cx="50.6" cy="54.4" r=".5" fill={FUR} stroke="none" />
          </>
        )}
        {/* 코·입 */}
        <path d="M45 60l-1.6-1.8h3.2Z" fill={BLUSH} stroke="none" />
        <path d="M45 60v1.4M45 61.4c-1 1.6-2.6 1.6-3.6.4M45 61.4c1 1.6 2.6 1.6 3.6.4" strokeWidth="1.5" />

        {/* 왼팔 — 완료면 잔을 들어 올린다 */}
        {done ? (
          <g>
            <path d="M30 88C23 84 19 76 23 70" />
            <path d="M13 60h14l-1.6 9h-10.8Z" fill="var(--color-card)" />
            <ellipse cx="20" cy="60" rx="6.2" ry="1.4" fill={COFFEE} stroke="none" />
            <path d="M27 62c3.5 0 3.5 5.5 0 5.5" />
            {/* 김 */}
            <path d="M17 54c-1.5-2 1.5-3.5 0-6M23 54c-1.5-2 1.5-3.5 0-6" strokeOpacity=".45">
              {moving && <animate attributeName="opacity" values=".3;1;.3" dur="1.8s" repeatCount="indefinite" />}
            </path>
            {moving && (
              <>
                <Sparkle x={66} y={40} s={3} begin="0s" />
                <Sparkle x={28} y={36} s={2.4} begin=".5s" />
                <Sparkle x={72} y={56} s={2} begin="1s" />
              </>
            )}
          </g>
        ) : (
          <path d="M30 88c-6 2-9 8-6 14" />
        )}

        {/* 오른팔 + 주전자 */}
        <g transform={`rotate(${ARM_ANGLE[pose]} ${SHOULDER[0]} ${SHOULDER[1]})`}>
          <path d="M60 84c8-2 16-10 23-14" />
          <g transform={`rotate(${KETTLE_ANGLE[pose]} ${HAND[0]} ${HAND[1]})`}>
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
            {/* 손잡이 */}
            <path d="M90 64c-8-1-8 13 0 12" />
            {/* 몸통·뚜껑 */}
            <path d="M90 62h18l3 16H87Z" fill={KETTLE} />
            <path d="M91 62c3-6 13-6 16 0" fill={KETTLE} />
            <circle cx="99" cy="56.5" r="1.5" fill={LINE} stroke="none" />
            {/* 구스넥 주둥이 */}
            <path d="M108 66c8-1 14-4 18-9 3-4 7-3.5 7 0" />
            {/* 물줄기 */}
            {pouring && (
              <path d="M133 58v13" stroke={WATER} strokeWidth="2.4" strokeDasharray="4 3" opacity=".9">
                {moving && <animate attributeName="stroke-dashoffset" values="0;-7" dur=".35s" repeatCount="indefinite" />}
              </path>
            )}
          </g>
          <circle cx={HAND[0]} cy={HAND[1]} r="3.2" fill={FUR} />
        </g>
      </g>
    </svg>
  );
}

function Face({ className = '' }: MascotFaceProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke={LINE}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`block h-auto w-full ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="17" cy="15" rx="4.6" ry="11" fill={FUR} transform="rotate(-12 17 24)" />
      <ellipse cx="17" cy="16" rx="2.2" ry="7" fill={EAR} stroke="none" transform="rotate(-12 17 24)" />
      <ellipse cx="31" cy="15" rx="4.6" ry="11" fill={FUR} transform="rotate(12 31 24)" />
      <ellipse cx="31" cy="16" rx="2.2" ry="7" fill={EAR} stroke="none" transform="rotate(12 31 24)" />
      <circle cx="24" cy="31" r="12.5" fill={FUR} />
      <circle cx="17" cy="34" r="2.4" fill={BLUSH} stroke="none" opacity=".75" />
      <circle cx="31" cy="34" r="2.4" fill={BLUSH} stroke="none" opacity=".75" />
      <circle cx="19.5" cy="30" r="1.6" fill={LINE} stroke="none" />
      <circle cx="28.5" cy="30" r="1.6" fill={LINE} stroke="none" />
      <path d="M24 34.5l-1.6-1.8h3.2Z" fill={BLUSH} stroke="none" />
      <path d="M24 34.5v1.3M24 35.8c-1 1.5-2.5 1.5-3.4.4M24 35.8c1 1.5 2.5 1.5 3.4.4" strokeWidth="1.5" />
    </svg>
  );
}

/** 발바닥 — 크림색 손에 분홍 발가락 셋 */
function Paw({ x, y, r }: { x: number; y: number; r: number }) {
  const t = r * 0.34;
  return (
    <g>
      <circle cx={x - r * 0.75} cy={y - r * 0.95} r={t} fill={EAR} />
      <circle cx={x} cy={y - r * 1.15} r={t} fill={EAR} />
      <circle cx={x + r * 0.75} cy={y - r * 0.95} r={t} fill={EAR} />
      <circle cx={x} cy={y} r={r} fill={FUR} />
    </g>
  );
}

/** 1인칭: 위에서 내려다본 구스넥 주전자와 그걸 쥔 손. 원점이 주둥이 끝 */
function PovKettle() {
  return (
    <g fill="none" stroke={LINE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {/* 손잡이 (몸통 뒤쪽으로) */}
      <path d="M25 29c5 4 8 7 11 11" />
      {/* 몸통 — 위에서 본 원. 뚜껑 테와 꼭지 */}
      <circle cx="18" cy="21" r="10.5" fill={KETTLE} />
      <circle cx="18" cy="21" r="5.5" strokeOpacity=".45" />
      <circle cx="18" cy="21" r="1.8" fill={LINE} stroke="none" />
      {/* 주둥이 — 몸통에서 원점(물이 떨어지는 자리)까지 */}
      <path d="M11 14C8 10 4 5 0 0" strokeWidth="2.6" />
      <Paw x={39} y={43} r={6.5} />
    </g>
  );
}

/** 1인칭: 드리퍼 옆에 놓인 다른 손과 팔 */
function PovRest() {
  return (
    <g fill="none" stroke={LINE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 94L7 100M22 94l3 6" />
      <Paw x={16} y={88} r={7} />
    </g>
  );
}

export const rabbit: MascotCharacter = {
  id: 'rabbit-v1-storybook',
  name: '바리스타 토끼 (자리표시, 동화풍)',
  Figure,
  Face,
  Pov: { Kettle: PovKettle, Rest: PovRest },
};
