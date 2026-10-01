import { UsersBasicInfoData } from 'bigbluebutton-html-plugin-sdk';

// Upper bound on the names published with each pick. The reel only ever shows five rows
// at a time, so a larger pool adds nothing on screen but grows every data channel entry.
export const MAX_REEL_NAMES = 20;

export interface Reel {
  names: string[];
  targetIndex: number;
}

/**
 * Picks the names the reel spins through, to be published along with the pick. Viewers do
 * not subscribe to the user list, so the names have to travel in the data channel entry.
 * The picked user is always included; the rest is a random sample of the other candidates,
 * returned in the client's user-list order so the reel reads alphabetically.
 * @param candidates users that could have been picked, the picked one included
 * @param pickedUser the user that was picked
 * @param random source of randomness, replaceable in tests
 * @returns at most MAX_REEL_NAMES names, sorted
 */
export const sampleReelNames = (
  candidates: UsersBasicInfoData[],
  pickedUser: UsersBasicInfoData,
  random: () => number = Math.random,
): string[] => {
  const others = candidates.filter((user) => user.userId !== pickedUser.userId);
  // Partial Fisher-Yates: only the first MAX_REEL_NAMES - 1 slots need to be shuffled.
  const sampleSize = Math.min(others.length, MAX_REEL_NAMES - 1);
  for (let i = 0; i < sampleSize; i += 1) {
    const j = i + Math.floor(random() * (others.length - i));
    [others[i], others[j]] = [others[j], others[i]];
  }
  return [pickedUser, ...others.slice(0, sampleSize)]
    .sort((a, b) => (a.nameSortable ?? a.name).localeCompare(b.nameSortable ?? b.name))
    .map((user) => user.name);
};

/**
 * Builds the reel for a pick. Picks published before the reel existed carry no names, and
 * then the reel holds the picked name alone, which is shown without spinning. The names
 * come from another client through the data channel, so anything but a list of them is
 * treated the same way.
 * @param reelNames names published with the pick, if any
 * @param pickedName name of the picked user
 * @returns the names on the reel and the index the spin has to stop at
 */
export const buildReel = (reelNames: string[] | undefined, pickedName: string): Reel => {
  const names = Array.isArray(reelNames) && reelNames.length
    ? reelNames.filter((name) => typeof name === 'string')
    : [pickedName];
  const targetIndex = names.indexOf(pickedName);
  if (targetIndex === -1) return { names: [...names, pickedName], targetIndex: names.length };
  return { names, targetIndex };
};

export const mod = (value: number, divisor: number) => ((value % divisor) + divisor) % divisor;

export const easeOutCubic = (progress: number) => 1 - (1 - progress) ** 3;

/**
 * Where a spin that starts at `start` has to stop: the first row showing the target name
 * that is at least `minRows` rows ahead, so every spin travels a similar distance.
 * @param start reel position the spin starts from (may be fractional mid-spin)
 * @param targetIndex index of the picked name on the reel
 * @param length number of names on the reel
 * @param minRows minimum number of rows the reel travels
 * @returns the final reel position
 */
export const getSpinEnd = (
  start: number,
  targetIndex: number,
  length: number,
  minRows: number,
) => start + minRows + mod(targetIndex - (start + minRows), length);

/**
 * How a row is drawn given its distance, in rows, from the reel's center line: the row on
 * the line is full size and bold, the ones next to it are dimmed, and the rest fade out.
 * @param distance signed distance from the center line
 * @returns the row's opacity, scale and whether it is emphasized
 */
export const getReelRowStyle = (distance: number) => {
  const absDistance = Math.abs(distance);
  const emphasis = Math.max(0, 1 - absDistance);
  const opacity = absDistance <= 1
    ? 1 - 0.45 * absDistance
    : Math.max(0, 0.55 - 0.4 * (absDistance - 1));
  return {
    opacity,
    scale: 1 + 0.35 * emphasis,
    emphasized: emphasis >= 0.5,
  };
};
