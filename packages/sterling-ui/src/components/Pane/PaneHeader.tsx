import { Box, BoxProps, useStyleConfig } from '@chakra-ui/react';
import sizes from '../../sizes';
import { tokens } from '../../tokens';

const PaneHeader = (props: BoxProps) => {
  const styles = useStyleConfig('PaneHeader');
  return <Box __css={styles} {...props} />;
};

const PaneHeaderTheme = {
  baseStyle: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: `${sizes.paneHeaderSize}px`,
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    px: 3,
    bg: tokens.color.surface,
    borderBottom: '1px solid',
    borderColor: tokens.color.rule,
    zIndex: 'banner'
  }
};

export { PaneHeader, PaneHeaderTheme };
