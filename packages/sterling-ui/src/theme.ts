import { extendTheme } from '@chakra-ui/react';
import { tokens } from './tokens';
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

// Chakra's built-in Menu (used by the view switcher, drawer section picker, and
// overflow menu) is themed through the CSS-var tokens so its popovers track the
// app theme — including dark mode, which Chakra's own colorMode doesn't drive
// here, so the stock light defaults would otherwise leave menus low-contrast.
const MenuTheme = {
  baseStyle: {
    list: {
      bg: tokens.color.surface,
      color: tokens.color.ink,
      borderColor: tokens.color.ruleStrong,
      borderWidth: '1px',
      boxShadow: 'lg'
    },
    item: {
      color: tokens.color.ink,
      _hover: { bg: tokens.color.surfaceMuted },
      _focus: { bg: tokens.color.surfaceMuted },
      _expanded: { bg: tokens.color.surfaceMuted }
    },
    groupTitle: {
      color: tokens.color.inkMuted
    },
    divider: {
      borderColor: tokens.color.rule,
      opacity: 1
    }
  }
};

// Ghost buttons (nav controls, theme toggle, menu triggers) get themed
// hover/active surfaces. Chakra's stock ghost variant derives these from its
// own (light) colorMode, which leaves a glaring light box on dark-mode active
// triggers. No ghost button sets a colorScheme, so a flat override is safe.
const ButtonTheme = {
  variants: {
    ghost: {
      color: tokens.color.ink,
      bg: 'transparent',
      _hover: { bg: tokens.color.surfaceMuted },
      _active: { bg: tokens.color.surfaceMuted },
      _expanded: { bg: tokens.color.surfaceMuted }
    }
  }
};

const sterlingTheme = extendTheme({
  fonts: {
    body: tokens.fonts.body,
    heading: tokens.fonts.body,
    mono: tokens.fonts.mono
  },
  styles: {
    global: {
      'html, body, #root': {
        w: 'full',
        h: 'full',
        overflow: 'hidden',
        userSelect: 'none',
        cursor: 'default'
      },
      body: {
        bg: tokens.color.bg,
        color: tokens.color.ink,
        fontFeatureSettings: '"ss01", "cv11"'
      }
    }
  },
  components: {
    Button: ButtonTheme,
    Dashboard: DashboardTheme,
    DragBar: DragBarTheme,
    DragHandle: DragHandleTheme,
    Logo: LogoTheme,
    LogList: LogListTheme,
    LogText: LogTextTheme,
    Menu: MenuTheme,
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
export { tokens } from './tokens';
