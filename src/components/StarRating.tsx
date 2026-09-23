import { Icon } from './Icon';

interface Props {
  value: number | undefined;
  onChange?: (value: number) => void;
  size?: number;
}

export function StarRating({ value, onChange, size = 20 }: Props) {
  const readOnly = !onChange;
  return (
    <div className={readOnly ? 'flex gap-0.5' : 'flex gap-1'} role={readOnly ? 'img' : 'radiogroup'} aria-label={`별점 ${value ?? 0} / 5`}>
      {[1, 2, 3, 4, 5].map((n) =>
        readOnly ? (
          <Icon key={n} name="star" size={size} filled={(value ?? 0) >= n} className={(value ?? 0) >= n ? 'text-crema' : 'text-line-strong'} />
        ) : (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n}점`}
            onClick={() => onChange(n)}
            className={`rounded p-0.5 transition ${(value ?? 0) >= n ? 'text-crema' : 'text-ink-faint hover:text-ink-soft'}`}
          >
            <Icon name="star" size={size} filled={(value ?? 0) >= n} />
          </button>
        ),
      )}
    </div>
  );
}
