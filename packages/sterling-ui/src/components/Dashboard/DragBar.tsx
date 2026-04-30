import { Box, useStyleConfig } from '@chakra-ui/react';
import { tokens } from '../../tokens';

const DragBar = () => {
  const styles = useStyleConfig('DragBar');
  return <Box __css={styles} />;
};

const DragBarTheme = {
  baseStyle: {
    w: '1px',
    h: 'full',
    transition: 'background-color ease 0.2s',
    backgroundColor: tokens.color.rule,
    '.drag-handle:hover &': {
      backgroundColor: tokens.color.accent
    }
  }
};

export { DragBar, DragBarTheme };
