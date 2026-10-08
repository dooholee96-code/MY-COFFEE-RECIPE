import { Component, type ReactNode } from 'react';
import { allKeys, clearAll } from '../lib/storage';

interface State {
  error: Error | null;
}

/**
 * 렌더 중 예외가 나면 흰 화면 대신 복구 화면을 보여준다.
 *
 * 이 앱의 상태는 전부 localStorage 에 있어서, 한 번 깨진 데이터(잘못된 백업 파일 등)는
 * 새로고침해도 똑같이 깨진다 — 복구 화면이 없으면 개발자 도구 없이는 영영 못 연다.
 * 그래서 여기서 (1) 저장된 데이터를 그대로 내려받을 수 있게 하고, (2) 초기화를 제공한다.
 * 초기화는 한 번 더 확인을 받는다 — 기록은 지워지면 안 되는 사용자 데이터다.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  private exportRaw = () => {
    const dump: Record<string, unknown> = {};
    for (const k of allKeys()) {
      try {
        dump[k] = JSON.parse(localStorage.getItem(k) ?? 'null');
      } catch {
        dump[k] = localStorage.getItem(k);
      }
    }
    const blob = new Blob([JSON.stringify({ version: 'raw', exportedAt: new Date().toISOString(), data: dump }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-coffee-raw-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  private reset = () => {
    if (!window.confirm('이 브라우저에 저장된 레시피·기록·원두·설정을 모두 지웁니다. 먼저 백업을 내려받았나요?')) return;
    clearAll();
    location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="mx-auto max-w-md px-5 py-14 text-ink">
        <p className="eyebrow">Something went wrong</p>
        <h1 className="hand mt-1 text-[24px] leading-tight">화면을 그리다 멈췄습니다</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          저장된 데이터는 그대로 있습니다. 새로고침해도 똑같다면 저장된 데이터 중 하나가 깨진 것일 수 있습니다.
          아래에서 먼저 백업을 내려받은 뒤 초기화하세요.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-well p-3 text-[11px] text-ink-faint">{this.state.error.message}</pre>
        <div className="mt-4 flex flex-col gap-2">
          <button type="button" onClick={() => location.reload()} className="rounded-xl bg-crema py-3 font-bold text-on-crema hover:bg-crema-deep">
            새로고침
          </button>
          <button type="button" onClick={this.exportRaw} className="rounded-xl border border-line-strong bg-well py-3 font-bold text-ink hover:bg-line">
            저장된 데이터 전부 내려받기
          </button>
          <button type="button" onClick={this.reset} className="rounded-xl border border-danger/30 bg-danger-soft py-3 font-bold text-danger">
            초기화 (전부 지우기)
          </button>
        </div>
      </div>
    );
  }
}
