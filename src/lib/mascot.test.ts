import { describe, expect, it } from 'vitest';
import { mascotPoseFor } from './mascot';
import type { BrewStep } from '../types';

const pour: BrewStep = { atSec: 0, waterG: 50, label: '1차' };
const wait: BrewStep = { atSec: 45, waterG: 0, label: '드로다운' };
const eyeball: BrewStep = { atSec: null, waterG: null, label: '수위까지' };

describe('mascotPoseFor', () => {
  it('시작 전·단계 없음 → idle', () => {
    expect(mascotPoseFor('idle', undefined)).toBe('idle');
    expect(mascotPoseFor('idle', pour)).toBe('idle');
    expect(mascotPoseFor('running', undefined)).toBe('idle');
  });
  it('물을 붓는 단계 → pour (눈대중 단계 포함)', () => {
    expect(mascotPoseFor('running', pour)).toBe('pour');
    expect(mascotPoseFor('running', eyeball)).toBe('pour');
    expect(mascotPoseFor('paused', pour)).toBe('pour');
  });
  it('물을 붓지 않는 단계 → wait', () => {
    expect(mascotPoseFor('running', wait)).toBe('wait');
  });
  it('완료는 단계와 상관없이 done', () => {
    expect(mascotPoseFor('done', pour)).toBe('done');
    expect(mascotPoseFor('done', undefined)).toBe('done');
  });
});
