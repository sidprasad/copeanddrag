import { Logo, NavBar } from '@/sterling-ui';
import { Divider, Spacer } from '@chakra-ui/react';
import { ViewButtons } from './ViewButtons';
import { ThemeToggle } from './ThemeToggle';

const AppNavBar = () => {
  return (
    <NavBar className='shadow'>
      <Logo />
      <Divider orientation='vertical' mx={2} />
      <Spacer />
      <ViewButtons />
      <Divider orientation='vertical' mx={2} />
      <ThemeToggle />
    </NavBar>
  );
};

export { AppNavBar };
