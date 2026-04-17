import { Flex, FlexProps, useStyleConfig } from '@chakra-ui/react';
import sizes from '../sizes';

const StatusBar = (props: FlexProps) => {
  const styles = useStyleConfig('StatusBar');
  return <Flex __css={styles} {...props} />;
};

const StatusBarTheme = {
  baseStyle: {
    h: `${sizes.statusBarSize}px`,
    position: 'fixed',
    right: 0,
    bottom: 0,
    left: 0,
    display: 'flex',
    alignItems: 'center',
    px: 4,
    gap: 3,
    fontSize: 'sm',
    borderTop: '1px solid',
    borderColor: 'whiteAlpha.200',
    bg: 'rgba(12, 17, 30, 0.9)',
    color: 'gray.100',
    backdropFilter: 'saturate(180%) blur(10px)',
    boxShadow: '0 -8px 30px rgba(15, 23, 42, 0.3)'
  }
};

export { StatusBar, StatusBarTheme };
