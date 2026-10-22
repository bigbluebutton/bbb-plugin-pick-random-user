import styled from 'styled-components';
import { colors } from '@bigbluebutton/bbb-ui-components-react/colors';

// modalUiScale is applied once, as `zoom`, on the ancestor PluginModal, so sizes here
// are plain units: scaling them again would apply it twice.
const s = (val: number, unit = 'rem') => `${val}${unit}`;

// Five rows are in view: the result on the center line and two on each side of it.
const ReelViewport = styled.div`
  --pru-reel-row-height: ${s(2.75)};
  position: relative;
  width: 100%;
  height: calc(5 * var(--pru-reel-row-height));
  overflow: hidden;
  border: 1px solid ${colors.border.default};
  border-radius: 0.5rem;
  background-color: ${colors.background.light};
`;

const ReelRow = styled.div<{ $emphasized: boolean }>`
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  padding: 0 ${s(1.5)};
  font-weight: ${({ $emphasized }) => ($emphasized ? 700 : 400)};
  line-height: var(--pru-reel-row-height);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: ${colors.text.default};
  will-change: transform;
`;

// Rows grow as they approach the center line. Font size rather than a scale transform,
// so a long name is cut with an ellipsis inside the reel instead of being clipped by it.
const getReelRowFontSize = (scale: number) => s(1.125 * scale);

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

export {
  ReelViewport,
  ReelRow,
  getReelRowFontSize,
  VisuallyHidden,
};
