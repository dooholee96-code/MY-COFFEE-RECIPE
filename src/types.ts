/** 배전도. 'any' = 배전도를 가리지 않는 범용 레시피 */
export type RoastLevel = 'light' | 'medium' | 'dark' | 'any';

/** 음용 온도 */
export type ServeTemp = 'hot' | 'ice';

/** 추출 방식 대분류 (상단 탭) */
export type Category = 'drip' | 'mokapot' | 'espresso' | 'capsule';

/** 드립 카테고리 안에서의 기구 종류 */
export type DripperType = 'v60' | 'kalita' | 'chemex' | 'etc';

/** 그라인더별 분쇄도 세팅. v1에서 "코만단테 26~27 / EK43 13~14" 문자열이던 것을 구조화 */
export interface GrinderSetting {
  /** 그라인더 이름 (예: '코만단테') */
  grinder: string;
  /** 해당 그라인더에서의 값 (예: '26~27', '13~14') */
  setting: string;
}

/**
 * 추출 타임라인의 한 단계.
 *
 * `atSec` / `waterG` 가 null 인 단계는 시계나 저울로 고정되지 않는 동작을 뜻한다.
 * (예: "1cm 줄면 다시 가득" — 수위를 보며 반복하는 대용량 레시피)
 * null 인 단계가 있는 레시피는 타이머가 자동 진행하지 않고 수동 진행 모드로 바뀐다.
 */
export interface BrewStep {
  /** 추출 시작 기준 경과 초. null = 시계에 매이지 않는 단계 */
  atSec: number | null;
  /** 이 단계에서 "추가로" 붓는 물의 양(g). 0 = 붓지 않는 동작(대기·교반·제거), null = 눈대중 */
  waterG: number | null;
  /** 무엇을 하는지 */
  label: string;
  /** 물줄기 굵기, 교반 여부 등 기법 힌트 */
  hint?: string;
}

/** 추출이 끝난 뒤의 처리 — 가수, 얼음, 우유 */
export interface Finishing {
  /** 추출 후 더하는 물(가수). 예: 484 오리지널의 120g */
  waterG?: number;
  /** 서버나 잔에 미리 준비하는 얼음 */
  iceG?: number;
  /** 섞는 우유 (카페오레) */
  milkG?: number;
  /** 위 수치로 표현되지 않는 마무리 안내 */
  note?: string;
}

export interface Recipe {
  id: string;
  title: string;
  /**
   * 같은 레시피의 HOT/ICE 변형을 묶는 키.
   * v1에서는 4666 V2 가 h1 과 i2 로 완전히 분리돼 있어 서로를 찾을 수 없었다.
   */
  family?: string;
  category: Category;
  dripperType?: DripperType;
  serve: ServeTemp;
  roast: RoastLevel;
  /** 카드 우측 상단의 짧은 라벨 (예: 'Best Seller') */
  tag?: string;
  /** 레시피를 만든 사람/채널 */
  author?: string;
  youtubeUrl?: string;

  /** 원두 (g) */
  beanG: number;
  /** 추출에 쓰는 총 물 (g). pours 합계와 일치해야 한다 (recipes.test.ts 가 검증) */
  waterG: number;
  /** waterG 가 범위로 제시된 경우의 원문 표기 (예: '230~240g') */
  waterNote?: string;
  /** 물 온도 (℃) */
  tempC: number;
  /** 분쇄도 서술 (예: '보통-굵게') */
  grind: string;
  grinderSettings?: GrinderSetting[];
  /** 추천 기구 서술 */
  gear: string;
  /** 목표 종료 시각 (초) */
  totalSec: number;
  steps: BrewStep[];
  note?: string;
  finishing?: Finishing;
  /** 사용자가 앱에서 직접 추가한 레시피 여부 */
  custom?: boolean;
}

/** 목록 화면의 필터 상태 */
export interface Filters {
  category: Category;
  roast: RoastLevel | 'all';
  serve: ServeTemp | 'all';
  dripper: DripperType | 'all';
  /** 제목·태그·메모·작성자를 대상으로 하는 검색어 */
  query: string;
  /** 즐겨찾기만 보기 */
  favoritesOnly: boolean;
}
