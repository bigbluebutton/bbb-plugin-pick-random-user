import { BBBModal } from '@bigbluebutton/bbb-ui-components-react';
import { colors } from '@bigbluebutton/bbb-ui-components-react/colors';
import styled, { css, keyframes } from 'styled-components';

const s = (val: number, unit = 'rem') => `calc(${val}${unit} * var(--pru-sm, 1))`;

/**
 * BBBModal hardcodes inline styles that beat any CSS class, hence the
 * `!important`s. `zoom` (not `calc(... * var(--pru-sm))`) scales modalUiScale
 * into the library components too, since they don't read `--pru-sm`; `width`
 * stays a plain rem value below so zoom doesn't scale it twice.
 *
 * `zoom` resolves `vw`/`vh` against the real (unzoomed) viewport and then
 * multiplies the rendered box by the zoom factor, so a plain `95vw`/`90vh`
 * cap stops clamping past scale 1 (the multiplication happens after the
 * cap is checked). Dividing by `--pru-sm` here pre-compensates so the
 * rendered, zoomed-out size still tops out at 95vw/90vh of the real viewport.
 */
const PluginModal = styled(BBBModal)<{ $modalUiScale?: number; $hideCloseButton?: boolean }>`
  --pru-sm: ${({ $modalUiScale }) => $modalUiScale ?? 1};
  zoom: var(--pru-sm, 1);
  position: relative;
  z-index: 1000 !important;
  outline: transparent;
  outline-width: 2px;
  outline-style: solid;
  background-color: ${colors.background.white} !important;
  width: 32rem !important;
  max-width: calc(95vw / var(--pru-sm, 1)) !important;
  max-height: calc(90vh / var(--pru-sm, 1)) !important;
  border-radius: 0.5rem !important;
  box-shadow: 0 0.5rem 2rem ${colors.shadow.default};
  font-family: 'Source Sans Pro', Arial, sans-serif;

  &::-webkit-scrollbar {
    width: 5px;
    height: 5px;
  }
  &::-webkit-scrollbar-button {
    width: 0;
    height: 0;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.25);
    border: none;
    border-radius: 50px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.5);
  }
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border: none;
    border-radius: 50px;
  }
  &::-webkit-scrollbar-corner {
    background: transparent;
  }

  /* BBBModal always renders its close button, with no prop to suppress it - yet to come.
    Bots cannot dismiss the modal themselves — it auto-closes on the progress bar's
     timer — so the control is hidden for them rather than left on screen dead. */
  ${({ $hideCloseButton }) => $hideCloseButton && css`
    & [data-test$='-close-button'] {
      display: none;
    }
  `}
`;

const toastSlideIn = keyframes`
  from { opacity: 0; transform: translateX(-50%) translateY(8px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
`;

const toastSlideOut = keyframes`
  from { opacity: 1; transform: translateX(-50%) translateY(0); }
  to   { opacity: 0; transform: translateX(-50%) translateY(8px); }
`;

/* position:relative so the absolutely-positioned toast anchors to this wrapper,
   not to the overlay. The wrapper's own height equals only the modal — no shift. */
const ModalWithToastWrapper = styled.div`
  position: relative;
`;

const FloatingToast = styled.div<{ $exiting: boolean }>`
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: ${s(10, 'px')};
  width: fit-content;
  white-space: nowrap;
  padding: ${s(12, 'px')} ${s(20, 'px')};
  border-radius: 10px;
  background-color: ${colors.background.white};
  border: 0.5px solid ${colors.border.default};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: ${s(10, 'px')};
  font-family: 'Source Sans Pro', Arial, sans-serif;
  font-size: ${s(17, 'px')};
  color: ${colors.text.light};
  pointer-events: none;
  ${({ $exiting }) => css`
    animation: ${$exiting ? toastSlideOut : toastSlideIn} 0.35s ease forwards;
  `}
`;

/* Countdown bar pinned to the modal's bottom edge, shown only for bots —
   which can't dismiss the modal themselves — as their auto-close timer. */
const ProgressBarContainer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background-color: ${colors.neutral.neutral4};
  overflow: hidden;
`;

const ProgressBarFill = styled.div<{ $progress: number }>`
  height: 100%;
  background-color: ${colors.brand.brand1};
  width: ${({ $progress }) => `${$progress}%`};
  transition: width 0.03s linear;
`;

export {
  PluginModal,
  ModalWithToastWrapper,
  FloatingToast,
  ProgressBarContainer,
  ProgressBarFill,
};
