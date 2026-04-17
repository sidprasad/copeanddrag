import { Flex, FlexProps, useStyleConfig } from '@chakra-ui/react';
import sizes from '../../sizes';

const SideBar = (props: FlexProps) => {
  const styles = useStyleConfig('SideBar');
  return <Flex __css={{...styles, overflowY: 'auto'}} {...props} />;
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
    gap: '6px',
    px: 2,
    py: 3,
    borderLeft: '1px solid',
    borderColor: 'whiteAlpha.200',
    bg: 'rgba(11, 17, 32, 0.88)',
    backdropFilter: 'saturate(180%) blur(12px)',
    boxShadow: '-12px 0 30px rgba(15, 23, 42, 0.35)',
    color: 'gray.100',
    zIndex: 'banner'
  }
};

export { SideBar, SideBarTheme };
