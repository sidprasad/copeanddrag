import { Flex, FlexProps, useStyleConfig } from '@chakra-ui/react';
import sizes from '../../sizes';
import { tokens } from '../../tokens';

const SideBar = (props: FlexProps) => {
  const styles = useStyleConfig('SideBar');
  return <Flex __css={{ ...styles, overflowY: 'auto' }} {...props} />;
};

const SideBarTheme = {
  baseStyle: {
    w: `${sizes.sideBarSize}px`,
    position: 'fixed',
    top: `${sizes.navBarSize}px`,
    right: 0,
    bottom: `${sizes.statusBarSize}px`,
    display: 'flex',
    flexDir: 'column',
    alignItems: 'stretch',
    fontSize: 'xs',
    gap: '4px',
    px: 2,
    py: 3,
    borderLeft: '1px solid',
    borderColor: tokens.color.rule,
    bg: tokens.color.surface,
    color: tokens.color.ink,
    zIndex: 'banner'
  }
};

export { SideBar, SideBarTheme };
