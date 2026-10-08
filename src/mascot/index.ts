import { shiro } from './characters/shiro';
import type { MascotCharacter } from './types';

export type { MascotCharacter, MascotPose } from './types';

/**
 * 지금 앱에 나오는 캐릭터 — shirolee studio 의 아기 토끼 시로.
 * 캐릭터는 `MascotCharacter` 모양만 지키면 되고, 앱의 어디도 특정 캐릭터 파일을 직접 import 하지 않는다.
 * 디자인을 바꾸려면 `characters/` 에 파일을 하나 더 만들고 여기만 바꾼다.
 */
export const ACTIVE_CHARACTER: MascotCharacter = shiro;
