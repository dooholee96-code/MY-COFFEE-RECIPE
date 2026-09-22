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

// ─────────────────────────────────────────────────────────────────────────────
// 기록 (brew log) — 레시피를 "보는" 앱에서 "내가 뭘 내렸는지 쌓는" 앱으로
// ─────────────────────────────────────────────────────────────────────────────

/** 마신 뒤의 판정. 조정 제안의 입력이 된다. */
export type TasteVerdict = 'sour' | 'bitter' | 'weak' | 'strong' | 'balanced';

/** 내가 가진 원두 */
export interface Bean {
  id: string;
  name: string;
  roaster?: string;
  origin?: string;
  /** 가공 방식 (워시드/내추럴/허니 등) */
  process?: string;
  roastLevel?: RoastLevel;
  /** 로스팅 날짜 (YYYY-MM-DD). 디게싱 일수를 세는 데 쓴다 — 같은 레시피라도
   *  로스팅 3일차와 20일차는 다르게 나오므로 기록에 남길 가치가 있다. */
  roastedOn?: string;
  notes?: string;
  /**
   * 이 원두로 V60 이 잘 나오는 클릭 수.
   *
   * 같은 그라인더라도 원두마다 분쇄도를 달리 쓴다(밀도·배전도·디게싱에 따라). 이 값이 있으면
   * 그라인더의 기본 기준점 대신 쓰여서, 모든 레시피의 환산값이 이 원두에 맞춰 함께 움직인다.
   * 그라인더를 바꾸면 의미가 없어지므로 어느 그라인더 기준인지 같이 적어 둔다.
   */
  grindAnchor?: { grinderId: string; clicks: number };
  /** 다 마신 원두. 목록에서 내리되 과거 기록은 유지한다. */
  finished?: boolean;
}

/** 실제로 한 번 내린 기록 */
export interface BrewLog {
  id: string;
  recipeId: string;
  /** 레시피가 지워지거나 바뀌어도 기록이 남도록 이름을 같이 박아 둔다 */
  recipeTitle: string;
  beanId?: string;
  /** ISO 8601 */
  brewedAt: string;
  /** 실제로 쓴 값 — 원두량을 조정했다면 조정된 값이 들어온다 */
  beanG: number;
  waterG: number;
  tempC: number;
  /** 실제로 쓴 분쇄도 (예: '코만단테 24클릭') */
  grindNote?: string;
  /** 실제로 걸린 시간 (초). 타이머로 내렸다면 자동으로 채워진다 */
  actualSec?: number;
  /** 1~5 */
  rating?: number;
  taste?: TasteVerdict;
  note?: string;
}
