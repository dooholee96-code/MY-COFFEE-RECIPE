import { Icon } from './Icon';

interface Props {
  baseBeanG: number;
  value: number;
  onChange: (grams: number) => void;
}

/**
 * 원두량을 바꿔 레시피 전체를 비례 조정하는 컨트롤.
 *
 * v1 은 모든 수치가 "18g" 같은 문자열이라 산술이 불가능했고, 원두를 15g 만 쓰고 싶으면
 * 물 양을 머리로 환산해야 했다. 숫자 모델로 바꾼 가장 실용적인 이유가 이것이다.
 */
export function DoseScaler({ baseBeanG, value, onChange }: Props) {
  const changed = Math.abs(value - baseBeanG) > 0.05;
  const presets = [...new Set([baseBeanG, 15, 18, 20, 25, 30, 40])].sort((a, b) => a - b);

  return (
    <section className="rounded-2xl border border-stone-700 bg-stone-900/60 p-4" aria-label="원두량 조정">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-xs font-bold tracking-wider text-stone-400 uppercase">
          <Icon name="scale" size={14} className="text-amber-500" />
          원두량 조정
        </h4>
        {changed && (
          <button
            type="button"
            onClick={() => onChange(baseBeanG)}
            className="text-xs font-semibold text-amber-500 hover:underline"
          >
            원본 {baseBeanG}g 으로
          </button>
        )}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, Math.round((value - 1) * 10) / 10))}
          aria-label="원두량 1g 줄이기"
          className="h-10 w-10 shrink-0 rounded-lg border border-stone-600 bg-stone-700 text-lg font-bold text-stone-200 hover:bg-stone-600"
        >
          −
        </button>
        <label className="flex flex-1 items-baseline justify-center gap-1">
          <span className="sr-only">원두량 (g)</span>
          <input
            type="number"
            inputMode="decimal"
            min={1}
            max={500}
            step={0.5}
            value={value}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n) && n > 0) onChange(Math.min(500, n));
            }}
            className="w-24 border-b border-stone-600 bg-transparent text-center font-mono text-2xl font-bold text-stone-100 outline-none focus:border-amber-500"
          />
          <span className="font-mono text-lg font-bold text-stone-500">g</span>
        </label>
        <button
          type="button"
          onClick={() => onChange(Math.min(500, Math.round((value + 1) * 10) / 10))}
          aria-label="원두량 1g 늘리기"
          className="h-10 w-10 shrink-0 rounded-lg border border-stone-600 bg-stone-700 text-lg font-bold text-stone-200 hover:bg-stone-600"
        >
          +
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={`rounded-lg border px-2.5 py-1 font-mono text-xs font-bold transition ${
              Math.abs(value - p) < 0.05
                ? 'border-amber-600 bg-amber-600 text-white'
                : 'border-stone-700 bg-stone-800 text-stone-400 hover:bg-stone-700'
            }`}
          >
            {p}g{p === baseBeanG ? ' *' : ''}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-stone-500">
        * 원본 레시피 · 물과 가수는 비례 조정되고, 시간·온도·분쇄도는 그대로입니다.
      </p>
    </section>
  );
}
