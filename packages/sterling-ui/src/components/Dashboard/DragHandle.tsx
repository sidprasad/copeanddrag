import { Box, useStyleConfig } from '@chakra-ui/react';
import { HANDLE_PAD } from './constants';
import { DragBar } from './DragBar';

const DragHandle = () => {
  const styles = useStyleConfig('DragHandle');
  return (
    <Box className='drag-handle' __css={styles}>
      <DragBar />
    </Box>
  );
};

const DragHandleTheme = {
  baseStyle: {
    w: `${2 * HANDLE_PAD}px`,
    h: 'full',
    mx: `-${HANDLE_PAD}px`,
    px: `${HANDLE_PAD}px`,
    cursor: 'col-resize',
    boxSizing: 'border-box',
    backgroundColor: 'transparent'
  }
};

export { DragHandle, DragHandleTheme };
