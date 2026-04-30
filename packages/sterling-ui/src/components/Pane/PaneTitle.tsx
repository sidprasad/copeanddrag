import { Center, CenterProps, useStyleConfig } from '@chakra-ui/react';
import { tokens } from '../../tokens';

// PaneTitles are quiet labels — italic, modest weight, but in `inkMuted`
// (#475569 = 7.5:1 contrast on white) so they remain WCAG AA-compliant
// as body-sized text.
const PaneTitle = (props: CenterProps) => {
  const styles = useStyleConfig('PaneTitle');
  return <Center __css={styles} {...props} />;
};

const PaneTitleTheme = {
  baseStyle: {
    fontSize: '13px',
    fontWeight: 500,
    fontStyle: 'italic',
    letterSpacing: '0.005em',
    textTransform: 'none',
    color: tokens.color.inkMuted
  }
};

export { PaneTitle, PaneTitleTheme };
