import styled from 'styled-components';

// modalUiScale is applied once, as `zoom`, on the ancestor PluginModal — this
// helper just formats the unit, it does not read the scale itself, so BBB
// library components rendered here (which have no notion of modalUiScale)
// scale along with everything else instead of needing their own handling.
const s = (val: number, unit = 'rem') => `${val}${unit}`;

const PickedUserViewWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

// BBBModal already pads its body sideways as much as its header, so the reel and the
// buttons line up with the title and the close button without padding of their own.
const PickedUserViewBody = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: ${s(1.5)};
`;

// Laid out like BBBModal's own footer (which `noFooter` turns off): the body's bottom
// margin plus this padding add up to its bottom spacing, and the gap matches.
const PickedUserViewFooter = styled.div`
  padding-bottom: ${s(0.75)};
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: ${s(1)};
`;

export {
  PickedUserViewWrapper,
  PickedUserViewBody,
  PickedUserViewFooter,
};
