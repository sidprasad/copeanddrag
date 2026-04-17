import { Box, BoxProps, useStyleConfig } from '@chakra-ui/react';

interface LogTextProps {
  variant?: 'message' | 'warning' | 'error' | 'timestamp';
}

const LogText = (props: BoxProps & LogTextProps) => {
  const { variant, ...rest } = props;
  const styles = useStyleConfig('LogText', { variant });
  return <Box as='p' __css={styles} {...rest} isTruncated />;
};

const LogTextTheme = {
  baseStyle: {
    fontFamily: 'mono',
    fontSize: 'xs'
  },
  variants: {
    message: {
      color: 'gray.900'
    },
    warning: {
      color: 'yellow.400',
      fontWeight: 'semibold'
    },
    error: {
      color: 'red.500',
      fontWeight: 'semibold'
    },
    timestamp: {
      display: 'flex',
      alignItems: 'center',
      color: 'gray.500'
    }
  },
  defaultProps: {
    variant: 'message'
  }
};

export { LogText, LogTextTheme };
