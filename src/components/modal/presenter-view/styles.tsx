import { colors } from '@bigbluebutton/bbb-ui-components-react/colors';
import styled from 'styled-components';

// modalUiScale is applied once, as `zoom`, on the ancestor PanelWrapper — this
// helper just formats the unit, it does not read the scale itself, so BBB
// library components rendered here (which have no notion of modalUiScale)
// scale along with everything else instead of needing their own handling.
const s = (val: number, unit = 'rem') => `${val}${unit}`;

// ── Filter checkboxes section ─────────────────────────────────────────────────

const FilterRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${s(0.5)};
`;

const FilterCheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${s(1)};
  flex-wrap: wrap;
`;

// ── Section header row (label + count/action) ─────────────────────────────────

const SectionHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${s(0.625)};
`;

// ── User lists (shared by both sections) ──────────────────────────────────────

// Purely presentational card — the scrolling itself is delegated to BBBScrollArea.
// flex:1 (down from AvailableSection/PreviouslyPickedSection) is what lets it
// grow into whatever share of the panel's height is left over; min-height:0
// is needed alongside it, since a flex item's content size is otherwise a
// floor under its own flex-computed height, which would defeat shrinking.
const ListCard = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  background: ${colors.background.light};
  border-radius: 0.375rem;
`;

const UserList = styled.ul`
  list-style: none;
  margin: 0;
  padding: ${s(0.5)} ${s(1)};
  display: flex;
  flex-direction: column;
  gap: ${s(0.5)};
`;

const UserRow = styled.li`
  display: flex;
  align-items: center;
  gap: ${s(0.625)};
`;

// Wraps a BBBTypography child: styled-components' typings clash with the
// library's own polymorphic `as` prop when wrapping it directly via `styled()`,
// so layout/overflow CSS that Typography itself can't express lives here instead.
const UserNameText = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

// ── Available users section ───────────────────────────────────────────────────

const RoleBadge = styled.span`
  background: ${colors.neutral.neutral4};
  padding: ${s(0.125)} ${s(0.5)};
  border-radius: 0.1875rem;
  margin-left: auto;
  flex-shrink: 0;
  white-space: nowrap;
`;

// ── Previously picked section ─────────────────────────────────────────────────

const EmptyStateContainer = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${colors.background.light};
  border-radius: 0.375rem;
  padding: ${s(1.125)};
  text-align: center;
`;

const PickedTimeText = styled.span`
  margin-left: auto;
  flex-shrink: 0;
`;

// ── Loading state (shown while the first user snapshot has not arrived yet) ────

const LoadingContainer = styled.div`
  flex: 1;
  min-height: 0;
  background: ${colors.background.light};
  border-radius: 0.375rem;
  padding: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

// ── Footer / action button ────────────────────────────────────────────────────

// BBBDivider renders edge to edge on its own — the 1rem gap to the divider
// above it, and the padding below for the button/warning, live here instead
// of on the divider so the divider itself is never inset.
const FooterContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${s(1)};
  flex-shrink: 0;
`;

const FooterContent = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 ${s(1)} ${s(1)};
`;

// BBButton has no width prop, so it's centered by stretching it to the full
// width of its wrapper via a descendant selector on the native <button> it renders.
const PickButtonWrapper = styled.div`
  display: flex;

  & > button {
    width: 100%;
  }
`;

const NoUsersWarning = styled.p`
  font-size: ${s(1.0625)};
  color: ${colors.text.light};
  text-align: center;
  margin: 0;
  padding: ${s(0.5)} 0;
`;

// ── Outer wrappers ────────────────────────────────────────────────────────────

const PresenterViewWrapper = styled.div`
  font-family: 'Source Sans Pro', Arial, sans-serif;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
`;

// The filter checkboxes (OptionsSection) keep their natural height; the two
// list sections below share whatever height is left over, equally — see
// their own flex:1 for that. Scrolling now happens per-list, inside each
// one's own BBBScrollArea, so this no longer scrolls as a whole.
const ContentPadding = styled.div`
  padding: ${s(1.25)} ${s(1.5)} ${s(1)};
  display: flex;
  flex-direction: column;
  gap: ${s(1.25)};
  flex: 1;
  overflow: hidden;
  min-height: 0;
`;

const OptionsSection = styled.div``;

// flex:1 splits the space left in ContentPadding evenly between the two list
// sections (both get it, so it's a 1:1 share); min-height:0 lets each shrink
// below its content's natural height instead of just pushing the other one
// out, which a flex item's default min-height:auto would otherwise force.
const AvailableSection = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
`;

const PreviouslyPickedSection = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
`;

export {
  FilterRow,
  FilterCheckboxGroup,
  SectionHeaderRow,
  ListCard,
  UserList,
  UserRow,
  UserNameText,
  RoleBadge,
  EmptyStateContainer,
  LoadingContainer,
  PickedTimeText,
  FooterContainer,
  FooterContent,
  PickButtonWrapper,
  NoUsersWarning,
  PresenterViewWrapper,
  ContentPadding,
  OptionsSection,
  AvailableSection,
  PreviouslyPickedSection,
};
