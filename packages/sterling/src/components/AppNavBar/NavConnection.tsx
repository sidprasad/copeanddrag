import { Center, Tooltip } from '@chakra-ui/react';
import { useSterlingSelector } from '../../state/hooks';
import { selectIsConnected, selectProviderName } from '../../state/selectors';
import { ConnectionDot } from '../AppStatusBar/ConnectionDot';

// Compact connection indicator for the nav bar: just the status dot with a
// descriptive tooltip (the verbose "Connected"/"Disconnected" text label that
// used to live in the status bar is dropped).
const NavConnection = () => {
  const isConnected = useSterlingSelector(selectIsConnected);
  const providerName = useSterlingSelector(selectProviderName);
  const tooltip = isConnected
    ? `Connected to ${providerName}`
    : 'Not connected to a provider';
  return (
    <Tooltip hasArrow label={tooltip}>
      <Center px={1}>
        <ConnectionDot isConnected={isConnected} />
      </Center>
    </Tooltip>
  );
};

export { NavConnection };
