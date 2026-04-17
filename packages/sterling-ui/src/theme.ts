import { extendTheme } from '@chakra-ui/react';
import { DashboardTheme } from './components/Dashboard/Dashboard';
import { DragBarTheme } from './components/Dashboard/DragBar';
import { DragHandleTheme } from './components/Dashboard/DragHandle';
import { PaneTheme } from './components/Pane/Pane';
import { LogListTheme } from './components/Log/LogList';
import { LogTextTheme } from './components/Log/LogText';
import { LogoTheme } from './components/Logo';
import { NavBarTheme } from './components/NavBar/NavBar';
import { NavButtonTheme } from './components/NavBar/NavButton';
import { PaneBodyTheme } from './components/Pane/PaneBody';
import { PaneHeaderTheme } from './components/Pane/PaneHeader';
import { PaneTitleTheme } from './components/Pane/PaneTitle';
import { SideBarTheme } from './components/SideBar/SideBar';
import { SideBarButtonTheme } from './components/SideBar/SideBarButton';
import { StatusBarTheme } from './components/StatusBar';
import { ViewTheme } from './components/View';

const sterlingTheme = extendTheme({
  fonts: {
    body: 'InterVariable',
    mono: 'Fira Code VF, Fira Code, monospace'
  },
  styles: {
    global: {
      'html, body, #root': {
        w: 'full',
        h: 'full',
        overflow: 'hidden',
        userSelect: 'none',
        cursor: 'default'
      }
    }
  },
  components: {
    Dashboard: DashboardTheme,
    DragBar: DragBarTheme,
    DragHandle: DragHandleTheme,
    Logo: LogoTheme,
    LogList: LogListTheme,
    LogText: LogTextTheme,
    NavBar: NavBarTheme,
    NavButton: NavButtonTheme,
    Pane: PaneTheme,
    PaneBody: PaneBodyTheme,
    PaneHeader: PaneHeaderTheme,
    PaneTitle: PaneTitleTheme,
    SideBar: SideBarTheme,
    SideBarButton: SideBarButtonTheme,
    StatusBar: StatusBarTheme,
    View: ViewTheme
  }
});

export { sterlingTheme };
