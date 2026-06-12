import { Button, Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/react';
import { ReactElement } from 'react';
import { BiNetworkChart } from 'react-icons/bi';
import { FaTable } from 'react-icons/fa';
import { HiChevronDown, HiCode } from 'react-icons/hi';
import { MdEdit } from 'react-icons/md';
import { useSterlingDispatch, useSterlingSelector } from '../../state/hooks';
import { selectAvailableViews, selectMainView } from '../../state/selectors';
import { MainView } from '../../state/ui/ui';
import { mainViewChanged } from '../../state/ui/uiSlice';

interface ViewOption {
  value: MainView;
  label: string;
  icon: ReactElement;
}

const VIEW_OPTIONS: ViewOption[] = [
  { value: 'GraphView', label: 'Graph', icon: <BiNetworkChart /> },
  { value: 'TableView', label: 'Table', icon: <FaTable /> },
  { value: 'ScriptView', label: 'Script', icon: <HiCode /> },
  { value: 'EditView', label: 'Edit', icon: <MdEdit /> }
];

// The main view switcher — a compact dropdown in place of the old tab row.
const ViewMenu = () => {
  const dispatch = useSterlingDispatch();
  const availableViews = useSterlingSelector(selectAvailableViews);
  const mainView = useSterlingSelector(selectMainView);
  const options = VIEW_OPTIONS.filter((o) => availableViews.includes(o.value));
  const active = options.find((o) => o.value === mainView) ?? options[0];

  return (
    <Menu>
      <MenuButton
        as={Button}
        variant='ghost'
        size='sm'
        leftIcon={active?.icon}
        rightIcon={<HiChevronDown />}
      >
        {active?.label}
      </MenuButton>
      <MenuList>
        {options.map((o) => (
          <MenuItem
            key={o.value}
            icon={o.icon}
            onClick={() => dispatch(mainViewChanged(o.value))}
          >
            {o.label}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};

export { ViewMenu };
