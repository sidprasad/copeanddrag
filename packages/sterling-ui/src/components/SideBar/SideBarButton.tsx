import { Button, ButtonProps, Text, useStyleConfig } from '@chakra-ui/react';
import { tokens } from '../../tokens';

interface SideBarButtonProps {
  text: string;
}

const SideBarButton = (props: ButtonProps & SideBarButtonProps) => {
  const { text, ...rest } = props;
  const styles = useStyleConfig('SideBarButton');
  return (
    <Button as='div' __css={styles} iconSpacing='0.35rem' {...rest}>
      <Text
        as='div'
        display='flex'
        alignItems='center'
        justifyContent='center'
        userSelect='none'
        cursor='pointer'
      >
        {text}
      </Text>
    </Button>
  );
};

// SideBar is on the right edge. Active state = 2px purple rule on the
// button's INSIDE (left) edge — Tufte-style hairline marker.
//
// Default text uses `inkMuted` (#475569 = 7.5:1 on white) for WCAG AA.
// Focus indicator combines a 2px accent inset with a 1px outer halo so
// it remains visible against the adjacent SideBar surface (WCAG 2.4.11).
const SideBarButtonTheme = {
  baseStyle: {
    position: 'relative',
    display: 'flex',
    cursor: 'pointer',
    alignItems: 'center',
    justifyContent: 'center',
    py: 4,
    px: 2,
    minH: '44px',
    fontSize: 'xs',
    fontWeight: 500,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    transitionProperty: 'common',
    transitionDuration: 'fast',
    writingMode: 'vertical-lr',
    textOrientation: 'sideways',
    borderRadius: '2px',
    color: tokens.color.inkMuted,
    bg: 'transparent',
    boxShadow: 'inset 2px 0 0 transparent',
    iconSpacing: '0.35rem',
    span: {
      marginRight: '.12rem'
    },
    _hover: {
      color: tokens.color.ink,
      bg: tokens.color.surfaceMuted,
      _disabled: {
        bg: 'initial'
      }
    },
    _active: {
      color: tokens.color.accent,
      bg: 'transparent',
      boxShadow: `inset 2px 0 0 ${tokens.color.accent}`,
      transform: 'none'
    },
    _focusVisible: {
      outline: 'none',
      boxShadow: `inset 2px 0 0 ${tokens.color.accent}, 0 0 0 1px ${tokens.color.accent}`
    },
    _disabled: {
      opacity: 0.45,
      cursor: 'not-allowed'
    }
  }
};

export { SideBarButton, SideBarButtonTheme };
