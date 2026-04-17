import { SideBarButton } from '@/sterling-ui';
import { FaFilm } from 'react-icons/fa';
import { MdFilterCenterFocus, MdScience, MdWorkspacesOutline } from 'react-icons/md';
import { useSterlingDispatch, useSterlingSelector } from '../../state/hooks';
import { selectGraphDrawer, selectIsSynthesisEnabled, selectMainView } from '../../state/selectors';
import { graphDrawerViewChanged } from '../../state/ui/uiSlice';

const GraphViewButtons = () => {
  const dispatch = useSterlingDispatch();
  const view = useSterlingSelector(selectMainView);
  const drawer = useSterlingSelector(selectGraphDrawer);
  const isSynthesisEnabled = useSterlingSelector(selectIsSynthesisEnabled);
  
  return (
    <>
      <SideBarButton
        text='Time'
        rightIcon={<FaFilm />}
        isActive={view === 'GraphView' && drawer === 'state'}
        onClick={() => dispatch(graphDrawerViewChanged('state'))}
      />
      <SideBarButton
        text='Projections'
        rightIcon={<MdFilterCenterFocus />}
        isActive={view === 'GraphView' && drawer === 'projections'}
        onClick={() => dispatch(graphDrawerViewChanged('projections'))}
      />
      <SideBarButton
        text='Layout'
        rightIcon={<MdWorkspacesOutline />}
        isActive={view === 'GraphView' && drawer === 'layout'}
        onClick={() => dispatch(graphDrawerViewChanged('layout'))}
      />
      {isSynthesisEnabled && (
        <SideBarButton
          text='Synthesis'
          rightIcon={<MdScience />}
          isActive={view === 'GraphView' && drawer === 'synthesis'}
          onClick={() => dispatch(graphDrawerViewChanged('synthesis'))}
        />
      )}
    </>
  );
};

export { GraphViewButtons };
