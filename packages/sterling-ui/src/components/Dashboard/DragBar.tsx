import { Box, useStyleConfig } from '@chakra-ui/react';
import { tokens } from '../../tokens';

const DragBar = () => {
  const styles = useStyleConfig('DragBar');
  return <Box __css={styles} />;
};

// The hairline rule shown at the seam; thickens to the accent color on hover
// of the surrounding handle.
const DragBarTheme = {
  baseStyle: {
    w: 'full',
    h: '1px',
    transition: 'background-color ease 0.2s',
    backgroundColor: tokens.color.rule,
    '.drag-handle:hover &': {
      backgroundColor: tokens.color.accent
    }
  }
};

export { DragBar, DragBarTheme };
