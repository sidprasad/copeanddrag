import { Icon, IconProps } from '@chakra-ui/react';
import { GoDotFill } from 'react-icons/go';

interface ConnectionDotProps {
  isConnected: boolean;
}

const ConnectionDot = (props: IconProps & ConnectionDotProps) => {
  const { isConnected, ...rest } = props;
  const color = isConnected ? 'green.500' : 'red.500';
  return <Icon as={GoDotFill} color={color} {...rest} />;
};

export { ConnectionDot };
