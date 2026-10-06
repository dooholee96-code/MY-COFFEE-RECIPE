import { describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from './ErrorBoundary';

function Boom(): never {
  throw new Error('깨진 데이터');
}

describe('ErrorBoundary', () => {
  it('렌더 오류를 받아 복구 화면을 그린다', async () => {
    // React 는 잡은 오류도 console.error 로 찍는다 — 테스트 출력만 조용히
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    await act(async () => {
      root.render(
        <ErrorBoundary>
          <Boom />
        </ErrorBoundary>,
      );
    });
    expect(host.textContent).toContain('화면을 그리다 멈췄습니다');
    expect(host.textContent).toContain('깨진 데이터');
    expect(host.querySelector('button')).not.toBeNull();
    await act(async () => root.unmount());
    host.remove();
    quiet.mockRestore();
  });
});
