import { describe, it, expect } from 'vitest';
import { UsersBasicInfoData } from 'bigbluebutton-html-plugin-sdk';
import {
  MAX_REEL_NAMES,
  buildReel,
  getReelRowStyle,
  getSpinEnd,
  mod,
  sampleReelNames,
} from '../../src/components/modal/picked-user-reel/utils';

const user = (name: string): UsersBasicInfoData => ({
  userId: `id-${name}`,
  extId: `ext-${name}`,
  name,
  nameSortable: name.toLowerCase(),
  bot: false,
  role: 'VIEWER',
  avatar: '',
  color: '#000',
  isModerator: false,
  presenter: false,
});

describe('sampleReelNames', () => {
  it('returns every candidate, sorted by sortable name, when the pool is small', () => {
    const candidates = ['Camila', 'ana', 'Bruno'].map(user);
    expect(sampleReelNames(candidates, candidates[2])).toEqual(['ana', 'Bruno', 'Camila']);
  });

  it('caps the sample and always keeps the picked user', () => {
    const candidates = Array.from({ length: 50 }, (_, i) => user(`User ${String(i).padStart(2, '0')}`));
    const picked = candidates[37];
    const names = sampleReelNames(candidates, picked);

    expect(names).toHaveLength(MAX_REEL_NAMES);
    expect(names).toContain(picked.name);
    expect(new Set(names).size).toBe(MAX_REEL_NAMES);
    expect([...names].sort()).toEqual(names);
  });

  it('returns just the picked user when there is no one else', () => {
    const picked = user('Ana');
    expect(sampleReelNames([picked], picked)).toEqual(['Ana']);
  });
});

describe('buildReel', () => {
  it('points at the picked name', () => {
    expect(buildReel(['Ana', 'Bruno', 'Camila'], 'Bruno')).toEqual({
      names: ['Ana', 'Bruno', 'Camila'],
      targetIndex: 1,
    });
  });

  it('holds the picked name alone for picks published without reel names', () => {
    expect(buildReel(undefined, 'Bruno')).toEqual({ names: ['Bruno'], targetIndex: 0 });
    expect(buildReel([], 'Bruno')).toEqual({ names: ['Bruno'], targetIndex: 0 });
  });

  it('ignores reel names that are not a list of names', () => {
    expect(buildReel('Ana' as never, 'Bruno')).toEqual({ names: ['Bruno'], targetIndex: 0 });
    expect(buildReel([1, 'Ana', null] as never, 'Ana')).toEqual({ names: ['Ana'], targetIndex: 0 });
  });

  it('adds the picked name when the published names miss it', () => {
    expect(buildReel(['Ana', 'Camila'], 'Bruno')).toEqual({
      names: ['Ana', 'Camila', 'Bruno'],
      targetIndex: 2,
    });
  });
});

describe('getSpinEnd', () => {
  it.each([
    [0, 4, 10],
    [7, 2, 10],
    [3.6, 1, 5],
    [12, 0, 2],
  ])('from %d stops on the target (%d of %d) at least the minimum distance away', (start, target, length) => {
    const end = getSpinEnd(start, target, length, 40);
    expect(mod(Math.round(end), length)).toBe(target);
    expect(end - start).toBeGreaterThanOrEqual(40);
    expect(end - start).toBeLessThan(40 + length);
  });
});

describe('getReelRowStyle', () => {
  it('emphasizes the row on the center line', () => {
    expect(getReelRowStyle(0)).toEqual({ opacity: 1, scale: 1.35, emphasized: true });
  });

  it('dims the rows next to the center line', () => {
    const { opacity, scale, emphasized } = getReelRowStyle(-1);
    expect(opacity).toBeCloseTo(0.55);
    expect(scale).toBe(1);
    expect(emphasized).toBe(false);
  });

  it('hides rows well past the edges', () => {
    expect(getReelRowStyle(3).opacity).toBe(0);
  });
});
