import { Button, ButtonProps, Text, useStyleConfig } from '@chakra-ui/react';

interface SideBarButtonProps {
  text: string;
}

const SideBarButton = (props: ButtonProps & SideBarButtonProps) => {
  const { text, ...rest } = props;
  const styles = useStyleConfig('SideBarButton');
  return (
    <Button as='div' __css={styles} iconSpacing='0.35rem' {...rest}>
      <Text
        as='div'
        display='flex'
        alignItems='center'
        justifyContent='center'
        userSelect='none'
        cursor='pointer'
      >
        {text}
      </Text>
    </Button>
  );
};

const SideBarButtonTheme = {
  baseStyle: {
    display: 'flex',
    cursor: 'pointer',
    alignItems: 'center',
    justifyContent: 'center',
    py: 4,
    fontSize: 'xs',
    fontWeight: 'semibold',
    transitionProperty: 'common',
    transitionDuration: 'normal',
    writingMode: 'vertical-lr',
    textOrientation: 'sideways',
    borderRadius: 'lg',
    border: '1px solid',
    borderColor: 'whiteAlpha.200',
    color: 'gray.100',
    bg: 'whiteAlpha.50',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.12)',
    iconSpacing: '0.35rem',
    span: {
      marginRight: '.12rem'
    },
    _hover: {
      bg: 'whiteAlpha.200',
      color: 'white',
      borderColor: 'whiteAlpha.300',
      transform: 'translateY(-1px)',
      _disabled: {
        bg: 'initial'
      }
    },
    _active: {
      bg: 'linear-gradient(180deg, #e0e7ff 0%, #c7d2fe 100%)',
      color: '#0f172a',
      borderColor: 'white',
      boxShadow: '0 14px 36px rgba(15, 23, 42, 0.35)',
      transform: 'translateY(-2px)'
    },
    _focusVisible: {
      boxShadow: '0 0 0 2px rgba(94, 234, 212, 0.65)',
      outline: 'none'
    }
  }
};

export { SideBarButton, SideBarButtonTheme };
