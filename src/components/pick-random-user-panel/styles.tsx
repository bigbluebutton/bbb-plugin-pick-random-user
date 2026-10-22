import { colors } from '@bigbluebutton/bbb-ui-components-react/colors';
import styled from 'styled-components';

/**
 * Root of the sidekick panel. `zoom` on `--pru-sm` scales this whole subtree —
 * our own elements (sized in plain rem, formatted by the shared `s()` helpers)
 * and the BBB library components (BBButton, BBBCheckbox, BBBTypography, ...)
 * alike, since neither reads the scale itself.
 */
const PanelWrapper = styled.div<{ $modalUiScale?: number }>`
  --pru-sm: ${({ $modalUiScale }) => $modalUiScale ?? 1};
  zoom: var(--pru-sm, 1);
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
  color: ${colors.text.default};
  font-family: 'Source Sans Pro', Arial, sans-serif;
`;

export { PanelWrapper };
