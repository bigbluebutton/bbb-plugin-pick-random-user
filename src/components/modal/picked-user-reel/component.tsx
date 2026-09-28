import * as React from 'react';
import { useEffect } from 'react';
import * as Styled from './styles';
import { PickedUserReelProps } from './types';
import { useReelSpin } from './hooks';
import { getReelRowStyle, mod } from './utils';

// Rows drawn on each side of the center line; the outermost ones are only partly in view.
const VISIBLE_ROWS_EACH_SIDE = 3;

/**
 * Slot-machine reel that spins through the reel names and stops on the picked user. The
 * rows are decorative, so they are hidden from assistive technologies, which get the
 * result from a status message once the reel stops.
 */
export function PickedUserReel(props: PickedUserReelProps) {
  const {
    names,
    targetIndex,
    spinKey,
    onSpinningChange,
    onLanded,
  } = props;

  const { position, spinning } = useReelSpin(names.length, targetIndex, spinKey, onLanded);

  useEffect(() => {
    onSpinningChange?.(spinning);
  }, [spinning]);

  // Unmounted mid-spin (the pick was cleared), the reel will never report that it stopped.
  useEffect(() => () => onSpinningChange?.(false), []);

  const centerRow = Math.round(position);
  // A reel holding a single name never spins, and repeating that name around it would
  // read as several users with the same name.
  const rowsEachSide = names.length > 1 ? VISIBLE_ROWS_EACH_SIDE : 0;
  const rows = [];
  for (let offset = -rowsEachSide; offset <= rowsEachSide; offset += 1) {
    const row = centerRow + offset;
    const distance = row - position;
    const { opacity, scale, emphasized } = getReelRowStyle(distance);
    const isResult = !spinning && row === centerRow;
    rows.push(
      <Styled.ReelRow
        key={row}
        $emphasized={emphasized}
        style={{
          opacity,
          fontSize: Styled.getReelRowFontSize(scale),
          transform: `translateY(calc(-50% + ${distance} * var(--pru-reel-row-height)))`,
        }}
        data-test={isResult ? 'pickRandomUserPickedUserName' : undefined}
      >
        {names[mod(row, names.length)]}
      </Styled.ReelRow>,
    );
  }

  return (
    <>
      <Styled.ReelViewport aria-hidden="true" data-test="pickRandomUserReel" data-spinning={spinning}>
        {rows}
      </Styled.ReelViewport>
      <Styled.VisuallyHidden role="status">
        {spinning ? '' : names[targetIndex]}
      </Styled.VisuallyHidden>
    </>
  );
}
