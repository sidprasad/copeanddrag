import { Button, ButtonProps, useStyleConfig } from '@chakra-ui/react';
import { tokens } from '../../tokens';

const NavButton = (props: ButtonProps) => {
  const styles = useStyleConfig('NavButton');
  return <Button __css={styles} {...props} />;
};

// Active = 2px purple underline (hairline accent), no filled pill.
// Default text uses `inkMuted` (7.5:1 contrast). Focus combines the
// underline with an outer halo so it survives WCAG 2.4.11 against the
// NavBar's white surface.
const NavButtonTheme = {
  baseStyle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    borderRadius: '0px',
    px: 3,
    py: 1.5,
    minH: '32px',
    lineHeight: 1.1,
    fontSize: 'sm',
    fontWeight: 500,
    color: tokens.color.inkMuted,
    bg: 'transparent',
    boxShadow: 'inset 0 -2px 0 transparent',
    transitionProperty: 'common',
    transitionDuration: 'fast',
    _hover: {
      color: tokens.color.ink,
      bg: 'transparent',
      boxShadow: `inset 0 -2px 0 ${tokens.color.accentBorder}`,
      _disabled: {
        bg: 'initial'
      }
    },
    _active: {
      color: tokens.color.accent,
      bg: 'transparent',
      boxShadow: `inset 0 -2px 0 ${tokens.color.accent}`
    },
    _focusVisible: {
      outline: 'none',
      boxShadow: `inset 0 -2px 0 ${tokens.color.accent}, 0 0 0 1px ${tokens.color.accent}`
    },
    _disabled: {
      opacity: 0.45,
      cursor: 'not-allowed'
    }
  }
};

export { NavButton, NavButtonTheme };
