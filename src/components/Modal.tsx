import { useEffect, useRef, type ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  /** 스크린 리더가 읽을 대화상자 제목 */
  label: string;
  children: ReactNode;
}

/**
 * 접근성을 갖춘 바텀시트/모달.
 *
 * v1 의 모달은 div 에 onClick 만 붙어 있어 Esc 로 닫을 수 없고, 포커스가 뒤쪽
 * 목록에 남아 키보드·스크린리더로는 쓸 수 없었다. 여기서 처리하는 것:
 * - Esc 로 닫기
 * - 열릴 때 안으로 포커스 이동, 닫을 때 원래 위치로 복귀
 * - Tab 이 모달 안에서만 돌게 가두기
 * - body 스크롤 잠금 (닫을 때 원래 값으로 되돌림 — v1 은 'auto' 로 덮어썼다)
 */
export function Modal({ open, onClose, label, children }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreTo.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      restoreTo.current?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusables = panel.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables?.length) return;
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-scrim backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className="animate-sheet relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-line bg-card shadow-2xl outline-none sm:max-w-lg sm:rounded-3xl"
      >
        {children}
      </div>
    </div>
  );
}
