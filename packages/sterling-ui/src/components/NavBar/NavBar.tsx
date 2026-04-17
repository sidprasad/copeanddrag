import { Flex, FlexProps, useStyleConfig } from '@chakra-ui/react';
import sizes from '../../sizes';

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
    bg: 'rgba(11, 17, 32, 0.92)',
    backgroundImage:
      'linear-gradient(120deg, #0f172a 0%, #111827 45%, #0b1224 100%)',
    color: 'gray.100',
    borderBottom: '1px solid',
    borderColor: 'whiteAlpha.200',
    boxShadow: '0 12px 40px rgba(15, 23, 42, 0.45)',
    backdropFilter: 'saturate(180%) blur(12px)',
    zIndex: 'banner'
  }
};

export { NavBar, NavBarTheme };
