import { connectSterling, disconnectSterling } from '@/sterling-connection';
import { Dashboard } from '@/sterling-ui';
import { useEffect } from 'react';
import { useSterlingDispatch, useSterlingSelector } from '../state/hooks';
import { selectDrawerIsCollapsed } from '../state/selectors';
import { AppDrawer } from './AppDrawer/AppDrawer';
import { AppNavBar } from './AppNavBar/AppNavBar';
import { AppStage } from './AppStage/AppStage';
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

  // The shell is intentionally minimal so the stage owns the screen: a slim
  // top bar, and a bottom-docked drawer that the stage gives way to vertically.
  return (
    <>
      <Dashboard
        bottomPaneCollapsed={drawerCollapsed}
        bottomPaneInitialHeight={layout.drawerHeight}
        bottomPaneMinHeight={layout.drawerMinHeight}
        bottomPaneMaxHeight={layout.drawerMaxHeight}
      >
        <AppStage />
        <AppDrawer />
      </Dashboard>
      <AppNavBar />
    </>
  );
};

export { Sterling };
