import { colors } from '@bigbluebutton/bbb-ui-components-react/colors';
import styled from 'styled-components';

const SIZES = {
  small: { dimension: '1.625rem', fontSize: '0.625rem', fontWeight: '600' },
  large: { dimension: '6rem', fontSize: '2.75rem', fontWeight: '400' },
};

const AvatarInitials = styled.div<{ $size: 'small' | 'large'; $color: string; $isModerator: boolean }>`
  width: ${({ $size }) => SIZES[$size].dimension};
  height: ${({ $size }) => SIZES[$size].dimension};
  border-radius: ${({ $isModerator }) => ($isModerator ? '20%' : '50%')};
  flex-shrink: 0;
  background: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ $size }) => SIZES[$size].fontSize};
  font-weight: ${({ $size }) => SIZES[$size].fontWeight};
  color: ${colors.neutral.white};
  text-transform: capitalize;
`;

const AvatarImage = styled.img<{ $size: 'small' | 'large'; $isModerator: boolean; $color: string }>`
  width: ${({ $size }) => SIZES[$size].dimension};
  height: ${({ $size }) => SIZES[$size].dimension};
  border-radius: ${({ $isModerator }) => ($isModerator ? '20%' : '50%')};
  flex-shrink: 0;
  object-fit: cover;
  border: 2px solid ${({ $color }) => $color};
`;

export { AvatarInitials, AvatarImage };
