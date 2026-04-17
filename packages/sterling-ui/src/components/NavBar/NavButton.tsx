import { Button, ButtonProps, useStyleConfig } from '@chakra-ui/react';

const NavButton = (props: ButtonProps) => {
  const styles = useStyleConfig('NavButton');
  return <Button __css={styles} {...props} />;
};

const NavButtonTheme = {
  baseStyle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    borderRadius: 'full',
    px: 4,
    py: 2,
    lineHeight: 1.1,
    fontSize: 'sm',
    fontWeight: 'semibold',
    color: 'gray.100',
    bg: 'whiteAlpha.50',
    border: '1px solid',
    borderColor: 'whiteAlpha.200',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.15)',
    transitionProperty: 'common',
    transitionDuration: 'normal',
    _hover: {
      bg: 'whiteAlpha.200',
      color: 'white',
      borderColor: 'whiteAlpha.300',
      _disabled: {
        bg: 'initial'
      }
    },
    _active: {
      bg: 'white',
      color: '#0f172a',
      borderColor: 'white',
      boxShadow: '0 12px 34px rgba(15, 23, 42, 0.35)'
    },
    _focusVisible: {
      boxShadow: '0 0 0 2px rgba(99, 102, 241, 0.6)',
      outline: 'none'
    },
    _disabled: {
      opacity: 0.4,
      cursor: 'not-allowed'
    }
  }
};

export { NavButton, NavButtonTheme };
