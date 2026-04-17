import { Grid, GridProps, useStyleConfig } from '@chakra-ui/react';

const LogList = (props: GridProps) => {
  const styles = useStyleConfig('LogList', props);
  return <Grid __css={styles} {...props} />;
};

const LogListTheme = {
  baseStyle: {
    display: 'grid',
    backgroundColor: 'gray.50',
    gridTemplateColumns: 'fit-content(300px) 1fr',
    gridColumnGap: '0.35rem',
    gridAutoRows: 'min-content',
    userSelect: 'text'
  }
};

export { LogList, LogListTheme };
