import type { Bean } from '../types';
import { daysOffRoast } from '../lib/dialIn';
import { type GrinderProfile, beanAnchorFor } from '../lib/grinders';
import { Icon } from './Icon';

interface Props {
  beans: Bean[];
  activeBeanId: string | null;
  onChange: (id: string | null) => void;
  myGrinder: GrinderProfile | undefined;
  /** 원두 기준이 없을 때 쓰이는 기준 (설정 보정값 또는 그라인더 기본값) */
  fallbackAnchor: number | null;
}

/**
 * 지금 쓰는 원두.
 *
 * 원두마다 분쇄도를 달리 쓰므로, 원두를 고르면 그 원두의 기준 클릭으로 모든 레시피의
 * 분쇄도 환산이 바뀐다. 보통 한 번에 한 봉지를 열어 두고 쓰니 전역으로 하나만 둔다.
 */
export function ActiveBeanPicker({ beans, activeBeanId, onChange, myGrinder, fallbackAnchor }: Props) {
  const open = beans.filter((b) => !b.finished);
  if (!open.length) return null;

  const active = open.find((b) => b.id === activeBeanId);
  const anchor = beanAnchorFor(active, myGrinder);
  const days = daysOffRoast(active?.roastedOn);

  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-line bg-card px-3 py-2">
      <Icon name="scale" size={15} className="shrink-0 text-crema" />
      <label className="min-w-0 flex-1">
        <span className="block text-[10px] font-bold tracking-wider text-ink-faint uppercase">지금 쓰는 원두</span>
        <select
          value={active?.id ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="w-full truncate bg-transparent text-sm font-semibold text-ink outline-none"
        >
          <option value="">선택 안 함</option>
          {open.map((b) => (
            <option key={b.id} value={b.id}>
              {[b.roaster, b.name].filter(Boolean).join(' ')}
            </option>
          ))}
        </select>
      </label>
      {myGrinder && (
        <span className="shrink-0 text-right">
          <span className="block num text-sm font-bold text-ink">
            {anchor ?? fallbackAnchor ?? '—'}
            <span className="ml-0.5 text-[10px] text-ink-faint">클릭</span>
          </span>
          <span className="block text-[10px] text-ink-faint">
            {anchor !== null ? '이 원두 기준' : active ? '원두 기준 없음' : 'V60 기준'}
            {days !== null && ` · ${days}일차`}
          </span>
        </span>
      )}
    </div>
  );
}
