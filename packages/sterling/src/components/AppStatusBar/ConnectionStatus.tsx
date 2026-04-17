import { Center, CenterProps, Text, Tooltip } from '@chakra-ui/react';
import { useSterlingSelector } from '../../state/hooks';
import { selectIsConnected, selectProviderName } from '../../state/selectors';
import { ConnectionDot } from './ConnectionDot';

const ConnectionStatus = (props: CenterProps) => {
  const isConnected = useSterlingSelector(selectIsConnected);
  const providerName = useSterlingSelector(selectProviderName);
  const tooltip = isConnected
    ? `Connected to ${providerName}`
    : 'Not connected to a provider';
  const text = isConnected ? 'Connected' : 'Disconnected';
  return (
    <Tooltip hasArrow label={tooltip}>
      <Center {...props}>
        <ConnectionDot isConnected={isConnected} />
        <Text mx={1} userSelect='none'>
          {text}
        </Text>
      </Center>
    </Tooltip>
  );
};

export { ConnectionStatus };
