import { rabbit } from './characters/rabbit';
import type { MascotCharacter } from './types';

export type { MascotCharacter, MascotPose } from './types';

/**
 * 지금 앱에 나오는 캐릭터. 정식 디자인이 나오면 여기만 바꾼다.
 * 캐릭터는 `MascotCharacter` 모양만 지키면 되고, 앱의 어디도 특정 캐릭터 파일을 직접 import 하지 않는다.
 */
export const ACTIVE_CHARACTER: MascotCharacter = rabbit;
