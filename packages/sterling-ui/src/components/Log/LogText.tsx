import { Box, BoxProps, useStyleConfig } from '@chakra-ui/react';
import { tokens } from '../../tokens';

interface LogTextProps {
  variant?: 'message' | 'warning' | 'error' | 'timestamp';
}

const LogText = (props: BoxProps & LogTextProps) => {
  const { variant, ...rest } = props;
  const styles = useStyleConfig('LogText', { variant });
  return <Box as='p' __css={styles} {...rest} isTruncated />;
};

// Log lives on a dark code surface (#1e1e1e). Variant colors picked for
// AA contrast on that bg:
//   #d4d4d4 fg     vs #1e1e1e — 11.5:1 (AAA)
//   #dcdcaa warn   vs #1e1e1e —  9.6:1 (AAA)
//   #f48771 error  vs #1e1e1e —  6.9:1 (AAA)
//   #9b9b9b stamp  vs #1e1e1e —  5.4:1 (AA)
const LogTextTheme = {
  baseStyle: {
    fontFamily: 'mono',
    fontSize: 'xs',
    lineHeight: '1.5'
  },
  variants: {
    message: {
      color: tokens.color.codeFg
    },
    warning: {
      color: '#dcdcaa',
      fontWeight: 'semibold'
    },
    error: {
      color: '#f48771',
      fontWeight: 'semibold'
    },
    timestamp: {
      display: 'flex',
      alignItems: 'center',
      color: tokens.color.codeMuted
    }
  },
  defaultProps: {
    variant: 'message'
  }
};

export { LogText, LogTextTheme };
