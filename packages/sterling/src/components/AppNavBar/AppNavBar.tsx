import { NavBar } from '@/sterling-ui';
import { Spacer } from '@chakra-ui/react';
import { NavConnection } from './NavConnection';
import { OverflowMenu } from './OverflowMenu';
import { PanelToggle } from './PanelToggle';
import { ThemeToggle } from './ThemeToggle';
import { ViewMenu } from './ViewMenu';

const AppNavBar = () => {
  return (
    <NavBar className='shadow'>
      <ViewMenu />
      <Spacer />
      <NavConnection />
      <PanelToggle />
      <ThemeToggle />
      <OverflowMenu />
    </NavBar>
  );
};

export { AppNavBar };
