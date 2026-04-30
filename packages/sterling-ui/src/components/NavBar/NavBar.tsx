import { Flex, FlexProps, useStyleConfig } from '@chakra-ui/react';
import sizes from '../../sizes';
import { tokens } from '../../tokens';

const NavBar = (props: FlexProps) => {
  const styles = useStyleConfig('NavBar');
  return <Flex __css={styles} {...props} />;
};

const NavBarTheme = {
  baseStyle: {
    h: `${sizes.navBarSize}px`,
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    px: 4,
    bg: tokens.color.surface,
    color: tokens.color.ink,
    borderBottom: '1px solid',
    borderColor: tokens.color.rule,
    zIndex: 'banner'
  }
};

export { NavBar, NavBarTheme };
