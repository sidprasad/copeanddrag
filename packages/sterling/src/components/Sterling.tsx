import { connectSterling, disconnectSterling } from '@/sterling-connection';
import { Dashboard } from '@/sterling-ui';
import { useEffect } from 'react';
import { useSterlingDispatch, useSterlingSelector } from '../state/hooks';
import { selectDrawerIsCollapsed } from '../state/selectors';
import { AppDrawer } from './AppDrawer/AppDrawer';
import { AppNavBar } from './AppNavBar/AppNavBar';
import { AppSideBar } from './AppSideBar/AppSideBar';
import { AppStage } from './AppStage/AppStage';
import { AppStatusBar } from './AppStatusBar/AppStatusBar';
import { defaultPreferences } from '../preferences';
// CndCore types are declared in ../types/cndcore.d.ts

interface SterlingProps {
  url?: string;
}

const Sterling = (props: SterlingProps) => {
  const { url } = props;
  const { layout } = defaultPreferences;
  const dispatch = useSterlingDispatch();
  const drawerCollapsed = useSterlingSelector(selectDrawerIsCollapsed);

  useEffect(() => {
    dispatch(connectSterling(url));
    return () => {
      dispatch(disconnectSterling());
    };
  }, [url, dispatch]);

  // Note: SpyTial error modal is mounted in GraphLayoutDrawer.tsx for contextual display

  return (
    <>
      <Dashboard
        rightPaneCollapsed={drawerCollapsed}
        rightPaneInitialWidth={layout.drawerWidth}
        rightPaneMinWidth={layout.drawerMinWidth}
        rightPaneMaxWidth={layout.drawerMaxWidth}
      >
        <AppStage />
        <AppDrawer />
      </Dashboard>
      <AppSideBar />
      <AppNavBar />
      <AppStatusBar />
    </>
  );
};

export { Sterling };
