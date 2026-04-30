import { Box, BoxProps, useStyleConfig } from '@chakra-ui/react';
import { tokens } from '../tokens';

// The wordmark is set in sentence case in the DOM and visually
// transformed to uppercase via CSS, so screen readers read it as
// "Cope and Drag" — not "C O P E A N D D R A G".
const Logo = (props: BoxProps) => {
  const styles = useStyleConfig('Logo');
  return (
    <Box
      __css={styles}
      role='img'
      aria-label='Cope and Drag'
      {...props}
    >
      <span className='cnd-logo-mark' aria-hidden='true' />
      <span className='cnd-logo-words'>Cope and Drag</span>
    </Box>
  );
};

const LogoTheme = {
  baseStyle: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.7rem',
    px: 1,
    py: 1,
    flexShrink: 0,
    color: tokens.color.ink,
    bg: 'transparent',
    boxShadow: 'none',
    borderRadius: 'none',
    lineHeight: '1',
    whiteSpace: 'nowrap',
    '.cnd-logo-mark': {
      display: 'inline-block',
      width: '3px',
      height: '14px',
      backgroundColor: tokens.color.accent,
      borderRadius: '0.5px',
      flexShrink: 0
    },
    '.cnd-logo-words': {
      fontFamily: 'body',
      fontWeight: 500,
      fontSize: '13px',
      letterSpacing: '0.24em',
      textTransform: 'uppercase',
      color: tokens.color.ink,
      whiteSpace: 'nowrap',
      flexShrink: 0
    }
  }
};

export { Logo, LogoTheme };
