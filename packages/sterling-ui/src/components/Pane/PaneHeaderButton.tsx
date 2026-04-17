import { Button, ButtonProps, forwardRef } from '@chakra-ui/react';

const PaneHeaderButton = forwardRef<ButtonProps, 'button'>(
  (props: ButtonProps, ref) => {
    return <Button colorScheme='green' size='xs' ref={ref} {...props} />;
  }
);

export { PaneHeaderButton };
