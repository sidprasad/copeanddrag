import { StatusBar } from '@/sterling-ui';
import { Center, Divider, Spacer, useDisclosure } from '@chakra-ui/react';
import { dumpClicked } from '../../state/data/dataSlice';
import { useSterlingDispatch } from '../../state/hooks';
import { ConnectionStatus } from './ConnectionStatus';
import { ManualXMLModal } from './ManualXMLModal';
import { HelpModal } from './HelpModal';

export const TEXT_manual_datum_button = 'Manual Datum'
export const TEXT_help_button = 'Help'

const AppStatusBar = () => {
  const dispatch = useSterlingDispatch();
  const disclosureXML = useDisclosure()
  const disclosureHelp = useDisclosure()
  
  return (
    <StatusBar data-testid='app-status-bar'>
      <div
        className='cursor-pointer transition-colors hover:text-white'
        onClick={disclosureHelp.onOpen}
      >
        <Spacer width='50px'/>
        <Center><strong>{TEXT_help_button}</strong></Center>
      </div>
      <HelpModal isOpen={disclosureHelp.isOpen} onClose={disclosureHelp.onClose}/>
      <Divider orientation='vertical' mx={2} />
      <Spacer />
      <Divider orientation='vertical' mx={2} />
      <div
        className='cursor-pointer transition-colors hover:text-white'
        onClick={disclosureXML.onOpen}
      >
        {TEXT_manual_datum_button}
      </div>
      <ManualXMLModal isOpen={disclosureXML.isOpen} onClose={disclosureXML.onClose}/>
      <Divider orientation='vertical' mx={2} />
      <div
        className='cursor-pointer transition-colors hover:text-white'
        onClick={() => {
          dispatch(dumpClicked());
        }}
      >
        Console Dump
      </div>
      <Divider orientation='vertical' mx={2} />
      <ConnectionStatus />
    </StatusBar>
  );
};

export { AppStatusBar };
