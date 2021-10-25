import styled from 'styled-components';
import Button from '/imports/ui/components/button/component';

const CaptionsButton = styled(Button)`
  ${({ ghost }) => ghost && `
      span {
        box-shadow: none;
        background-color: transparent !important;
        border-color: var(--color-white) !important;
      }
   `}
`;

export default {
  CaptionsButton,
};
