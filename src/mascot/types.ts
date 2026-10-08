import type { ReactElement } from 'react';

/**
 * 마스코트가 취하는 자세. 앱 상태(타이머·단계)에서 `mascotPoseFor()` 가 고른다.
 * - idle : 기다리는 중 — 시작 전, 빈 화면
 * - pour : 붓는 중 — 물을 넣는 단계
 * - wait : 지켜보는 중 — 뜸·드로다운처럼 물을 붓지 않는 단계, 일시정지
 * - done : 추출 완료
 */
export type MascotPose = 'idle' | 'pour' | 'wait' | 'done';

export interface MascotFigureProps {
  pose: MascotPose;
  /** false 면 멈춘 그림 (동작 줄이기, 일시정지) */
  moving: boolean;
  /** 겹치는 선을 가릴 바탕색 — 그림이 놓이는 면의 색을 넘긴다 */
  paper: string;
  className?: string;
}

export interface MascotFaceProps {
  /** 겹치는 선을 가릴 바탕색. 없으면 비워 둔다 */
  paper?: string;
  className?: string;
}

/**
 * 캐릭터 한 벌. 그림만 바꿔 끼울 수 있게 앱은 이 인터페이스로만 캐릭터를 다룬다.
 *
 * 새 캐릭터 디자인이 나오면 `characters/` 에 파일을 하나 더 만들어 이 모양을 채우고
 * `mascot/index.ts` 의 `ACTIVE_CHARACTER` 만 바꾸면 된다. 네 자세를 전부 그려야 하며,
 * 선 색은 `currentColor`, 면 색은 `paper` 를 써서 두 테마를 모두 탄다.
 */
export interface MascotCharacter {
  id: string;
  name: string;
  /** 전신 장면 — 커피를 내리는 바리스타. viewBox 는 가로로 긴 160×120 을 권장한다 */
  Figure: (props: MascotFigureProps) => ReactElement;
  /** 얼굴만 — 헤더 아바타처럼 작은 자리. 정사각 viewBox */
  Face: (props: MascotFaceProps) => ReactElement;
  /**
   * 1인칭 — 내 눈으로 내려다본 내 손. 선택 사항.
   * 붓는 궤적 그림(PourGlyph 의 위에서 본 뷰, viewBox 100×100)에 겹쳐 그린다. 없으면 손 없이 그린다.
   */
  Pov?: {
    /** 주전자를 든 손. 원점 (0,0) 이 주둥이 끝 — 물줄기 점과 함께 궤적을 따라 움직인다. 오른쪽 아래로 뻗는다 */
    Kettle: (props: MascotPovProps) => ReactElement;
    /** 드리퍼 옆에 놓인 다른 손. 100×100 좌표 그대로, 왼쪽 아래 구석 */
    Rest: (props: MascotPovProps) => ReactElement;
  };
}

export interface MascotPovProps {
  paper: string;
}
