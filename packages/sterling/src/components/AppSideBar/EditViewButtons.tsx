import { SideBarButton } from '@/sterling-ui';
import { FaFilm } from 'react-icons/fa';
import { MdFilterCenterFocus, MdWorkspacesOutline } from 'react-icons/md';
import { useSterlingDispatch, useSterlingSelector } from '../../state/hooks';
import { selectEditDrawer, selectMainView } from '../../state/selectors';
import { editDrawerViewChanged } from '../../state/ui/uiSlice';

const EditViewButtons = () => {
  const dispatch = useSterlingDispatch();
  const view = useSterlingSelector(selectMainView);
  const drawer = useSterlingSelector(selectEditDrawer);

  return (
    <>
      <SideBarButton
        text='Time'
        rightIcon={<FaFilm />}
        isActive={view === 'EditView' && drawer === 'state'}
        onClick={() => dispatch(editDrawerViewChanged('state'))}
      />
      <SideBarButton
        text='Projections'
        rightIcon={<MdFilterCenterFocus />}
        isActive={view === 'EditView' && drawer === 'projections'}
        onClick={() => dispatch(editDrawerViewChanged('projections'))}
      />
      <SideBarButton
        text='Layout'
        rightIcon={<MdWorkspacesOutline />}
        isActive={view === 'EditView' && drawer === 'layout'}
        onClick={() => dispatch(editDrawerViewChanged('layout'))}
      />
    </>
  );
};

export { EditViewButtons };
