import { Box, BoxProps, useStyleConfig } from '@chakra-ui/react';

const View = (props: BoxProps) => {
  const styles = useStyleConfig('View');
  return <Box __css={styles} {...props} />;
};

const ViewTheme = {
  baseStyle: {
    w: 'full',
    h: 'full'
  }
};

export { View, ViewTheme };
