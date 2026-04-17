import { Box, useStyleConfig } from '@chakra-ui/react';

const DragBar = () => {
  const styles = useStyleConfig('DragBar');
  return <Box __css={styles} />;
};

const DragBarTheme = {
  baseStyle: {
    w: '1px',
    h: 'full',
    transition: 'all ease 0.25s',
    backgroundColor: 'gray.300',
    '.drag-handle:hover &': {
      backgroundColor: 'gray.500'
    }
  }
};

export { DragBar, DragBarTheme };
