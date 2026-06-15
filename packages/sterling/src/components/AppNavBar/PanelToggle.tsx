import { Button } from '@chakra-ui/react';
import { VscLayoutPanel, VscLayoutPanelOff } from 'react-icons/vsc';
import { useSterlingSelector } from '../../state/hooks';
import { selectDrawerIsCollapsed } from '../../state/selectors';
import {
  useActiveDrawerSection,
  useDrawerSections,
  useSetDrawerSection
} from '../AppDrawer/drawerSections';

// Shows or hides the whole bottom drawer. Opening restores the first section
// for the current view; closing toggles the active section off.
const PanelToggle = () => {
  const collapsed = useSterlingSelector(selectDrawerIsCollapsed);
  const sections = useDrawerSections();
  const active = useActiveDrawerSection();
  const setSection = useSetDrawerSection();

  const toggle = () => {
    if (collapsed) {
      const target = sections[0];
      if (target) setSection(target.value);
    } else if (active) {
      setSection(active);
    }
  };

  const label = collapsed ? 'Show control panel' : 'Hide control panel';
  return (
    <Button
      aria-label={label}
      title={label}
      leftIcon={collapsed ? <VscLayoutPanel /> : <VscLayoutPanelOff />}
      size='sm'
      variant='ghost'
      onClick={toggle}
    >
      Control Panel
    </Button>
  );
};

export { PanelToggle };
