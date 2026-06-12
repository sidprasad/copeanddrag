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

// Horizontal handle: a full-width, row-resize strip straddling the seam
// between the stage (top) and the drawer (bottom).
const DragHandleTheme = {
  baseStyle: {
    w: 'full',
    h: `${2 * HANDLE_PAD}px`,
    my: `-${HANDLE_PAD}px`,
    py: `${HANDLE_PAD}px`,
    cursor: 'row-resize',
    boxSizing: 'border-box',
    backgroundColor: 'transparent'
  }
};

export { DragHandle, DragHandleTheme };
