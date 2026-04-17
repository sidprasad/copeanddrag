import { Box, BoxProps, forwardRef, useStyleConfig } from '@chakra-ui/react';

const Pane = forwardRef((props: BoxProps, ref) => {
  const styles = useStyleConfig('Pane');
  return <Box __css={styles} ref={ref} {...props} />;
});

const PaneTheme = {
  baseStyle: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
    // display: 'flex',
    // flexDir: 'column',
    // overflow: 'hidden'
  }
};

export { Pane, PaneTheme };
