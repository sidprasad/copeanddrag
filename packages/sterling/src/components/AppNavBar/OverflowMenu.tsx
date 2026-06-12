import {
  IconButton,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  useDisclosure
} from '@chakra-ui/react';
import { HiDotsVertical } from 'react-icons/hi';
import { dumpClicked } from '../../state/data/dataSlice';
import { useSterlingDispatch } from '../../state/hooks';
import { HelpModal } from '../AppStatusBar/HelpModal';
import { ManualXMLModal } from '../AppStatusBar/ManualXMLModal';

// Houses the utility actions that used to clutter the status bar — kept out of
// the way behind a single overflow button.
const OverflowMenu = () => {
  const dispatch = useSterlingDispatch();
  const xml = useDisclosure();
  const help = useDisclosure();
  return (
    <>
      <Menu placement='bottom-end'>
        <MenuButton
          as={IconButton}
          aria-label='More options'
          title='More options'
          icon={<HiDotsVertical />}
          size='sm'
          variant='ghost'
        />
        <MenuList>
          <MenuItem onClick={help.onOpen}>Help</MenuItem>
          <MenuDivider />
          <MenuItem onClick={xml.onOpen}>Load manual datum…</MenuItem>
          <MenuItem onClick={() => dispatch(dumpClicked())}>Console dump</MenuItem>
        </MenuList>
      </Menu>
      <ManualXMLModal isOpen={xml.isOpen} onClose={xml.onClose} />
      <HelpModal isOpen={help.isOpen} onClose={help.onClose} />
    </>
  );
};

export { OverflowMenu };
