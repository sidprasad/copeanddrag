import { Box, BoxProps, useStyleConfig } from '@chakra-ui/react';
import sizes from '../../sizes';

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
    bg: 'rgba(255, 255, 255, 0.92)',
    backgroundImage:
      'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.9) 100%)',
    borderBottom: '1px solid',
    borderColor: 'gray.200',
    boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)',
    backdropFilter: 'saturate(180%) blur(6px)',
    zIndex: 'banner'
  }
};

export { PaneHeader, PaneHeaderTheme };
