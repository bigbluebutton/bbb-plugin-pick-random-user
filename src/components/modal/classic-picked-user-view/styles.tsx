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

const PickedUserViewBody = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${s(2)};
  padding: ${s(1.5)};
`;

const PickedUserAvatarAndName = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${s(1.25)};
`;

const PickedUserViewFooter = styled.div`
  padding: 0 ${s(1.5)} ${s(1.25)};
  display: flex;
  flex-direction: column;
  gap: ${s(0.75)};
`;

export {
  PickedUserViewWrapper,
  PickedUserViewBody,
  PickedUserAvatarAndName,
  PickedUserViewFooter,
};
