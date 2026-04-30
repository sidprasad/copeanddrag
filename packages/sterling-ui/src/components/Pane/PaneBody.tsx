import { Box, BoxProps, useStyleConfig } from '@chakra-ui/react';
import sizes from '../../sizes';
import { tokens } from '../../tokens';

const PaneBody = (props: BoxProps) => {
  const styles = useStyleConfig('PaneBody');
  return <Box __css={styles} {...props} />;
};

const PaneBodyTheme = {
  baseStyle: {
    position: 'absolute',
    top: `${sizes.paneHeaderSize}px`,
    right: 0,
    bottom: 0,
    left: 0,
    bg: tokens.color.bg
  }
};

export { PaneBody, PaneBodyTheme };
