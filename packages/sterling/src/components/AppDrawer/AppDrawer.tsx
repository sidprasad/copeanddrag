import { Pane, PaneBody, PaneHeader } from '@/sterling-ui';
import { IconButton, Spacer } from '@chakra-ui/react';
import { MdClose } from 'react-icons/md';
import { useSterlingSelector } from '../../state/hooks';
import { selectMainView } from '../../state/selectors';
import { DrawerSectionMenu } from './DrawerSectionMenu';
import { useActiveDrawerSection, useSetDrawerSection } from './drawerSections';
import { GraphDrawer } from './graph/GraphDrawer';
import { ScriptDrawer } from './script/ScriptDrawer';
import { TableDrawer } from './table/TableDrawer';
import { EditDrawer } from './edit/EditDrawer';

const AppDrawer = () => {
  const view = useSterlingSelector(selectMainView);
  const active = useActiveDrawerSection();
  const setSection = useSetDrawerSection();
  return (
    <Pane>
      <PaneHeader className='border-b'>
        <DrawerSectionMenu />
        <Spacer />
        <IconButton
          aria-label='Close panel'
          title='Close panel'
          icon={<MdClose />}
          size='sm'
          variant='ghost'
          onClick={() => {
            if (active) setSection(active);
          }}
        />
      </PaneHeader>
      <PaneBody>
        {view === 'GraphView' && <GraphDrawer />}
        {view === 'TableView' && <TableDrawer />}
        {view === 'ScriptView' && <ScriptDrawer />}
        {view === 'EditView' && <EditDrawer />}
      </PaneBody>
    </Pane>
  );
};

export { AppDrawer };
