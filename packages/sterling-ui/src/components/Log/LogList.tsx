import { Grid, GridProps, useStyleConfig } from '@chakra-ui/react';
import { tokens } from '../../tokens';

const LogList = (props: GridProps) => {
  const styles = useStyleConfig('LogList', props);
  return <Grid __css={styles} {...props} />;
};

const LogListTheme = {
  baseStyle: {
    display: 'grid',
    backgroundColor: tokens.color.codeBg,
    color: tokens.color.codeFg,
    gridTemplateColumns: 'fit-content(300px) 1fr',
    gridColumnGap: '0.6rem',
    gridAutoRows: 'min-content',
    px: 3,
    py: 2,
    userSelect: 'text',
    fontFamily: tokens.fonts.mono
  }
};

export { LogList, LogListTheme };
