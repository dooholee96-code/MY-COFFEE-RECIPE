import type { Category, DripperType, RoastLevel } from '../types';

export const roastLabel = (roast: RoastLevel): string =>
  ({ light: '약배전', medium: '중배전', dark: '강배전', any: '범용' })[roast];

export const roastBadgeClass = (roast: RoastLevel): string =>
  ({
    light: 'border-orange-800/50 bg-orange-900/30 text-orange-300',
    medium: 'border-amber-800/50 bg-amber-900/30 text-amber-300',
    dark: 'border-stone-600 bg-stone-700/50 text-stone-300',
    any: 'border-teal-800/50 bg-teal-900/30 text-teal-300',
  })[roast];

export const dripperLabel = (d: DripperType): string =>
  ({ v60: 'V60', kalita: '칼리타', chemex: '케멕스', etc: '대형/기타' })[d];

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'drip', label: '브루잉(드립)' },
  { id: 'mokapot', label: '모카포트' },
  { id: 'espresso', label: '에스프레소' },
  { id: 'capsule', label: '캡슐' },
];

export const ROAST_OPTIONS: { id: RoastLevel | 'all'; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'light', label: '라이트' },
  { id: 'medium', label: '미디엄' },
  { id: 'dark', label: '다크' },
];

export const DRIPPER_OPTIONS: { id: DripperType | 'all'; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'v60', label: 'V60' },
  { id: 'kalita', label: '칼리타' },
  { id: 'etc', label: '대형/기타' },
];
