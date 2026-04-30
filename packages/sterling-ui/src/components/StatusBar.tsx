import { Flex, FlexProps, useStyleConfig } from '@chakra-ui/react';
import sizes from '../sizes';
import { tokens } from '../tokens';

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
    fontSize: 'xs',
    fontFamily: tokens.fonts.mono,
    borderTop: '1px solid',
    borderColor: tokens.color.rule,
    bg: tokens.color.surface,
    color: tokens.color.inkMuted
  }
};

export { StatusBar, StatusBarTheme };
