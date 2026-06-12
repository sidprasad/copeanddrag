import { Button, Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/react';
import { HiChevronDown } from 'react-icons/hi';
import {
  useActiveDrawerSection,
  useDrawerSections,
  useSetDrawerSection
} from './drawerSections';

// The drawer header's section picker — replaces the old right-hand sidebar.
// The button shows the open section's name; the menu switches between the
// sections available for the current view.
const DrawerSectionMenu = () => {
  const sections = useDrawerSections();
  const active = useActiveDrawerSection();
  const setSection = useSetDrawerSection();
  const activeSection = sections.find((s) => s.value === active);

  return (
    <Menu>
      <MenuButton
        as={Button}
        variant='ghost'
        size='sm'
        leftIcon={activeSection?.icon}
        rightIcon={<HiChevronDown />}
      >
        {activeSection?.label ?? 'Panel'}
      </MenuButton>
      <MenuList>
        {sections.map((section) => (
          <MenuItem
            key={section.value}
            icon={section.icon}
            onClick={() => {
              // Picking the open section is a no-op (use the close button to
              // hide), so re-selecting it doesn't collapse the drawer.
              if (section.value !== active) setSection(section.value);
            }}
          >
            {section.label}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};

export { DrawerSectionMenu };
