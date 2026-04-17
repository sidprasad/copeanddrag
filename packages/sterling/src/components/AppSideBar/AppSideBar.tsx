import { SideBar, SideBarButton } from '@/sterling-ui';
import { Spacer } from '@chakra-ui/react';
import { GoNote, GoTerminal } from 'react-icons/go';
import { FaFilm } from 'react-icons/fa';
import { useSterlingDispatch, useSterlingSelector } from '../../state/hooks';
import { selectDrawerView, selectMainView } from '../../state/selectors';
import { commonDrawerViewChanged } from '../../state/ui/uiSlice';
import { GraphViewButtons } from './GraphViewButtons';
import { ScriptViewButtons } from './ScriptViewButtons';
import { TableViewButtons } from './TableViewButtons';
import { EditViewButtons } from './EditViewButtons';

const AppSideBar = () => {
  const dispatch = useSterlingDispatch();
  const view = useSterlingSelector(selectMainView);
  const drawer = useSterlingSelector(selectDrawerView);
  return (
    <SideBar>
      {view === 'GraphView' && <GraphViewButtons />}
      {view === 'TableView' && <TableViewButtons />}
      {view === 'ScriptView' && <ScriptViewButtons />}
      {view === 'EditView' && <EditViewButtons />}
      <Spacer />
      
      <SideBarButton
        text='Explorer'
        rightIcon={<FaFilm />}
        isActive={drawer === 'explorer'}
        onClick={() => dispatch(commonDrawerViewChanged('explorer'))}
      />
      <SideBarButton
        text='Evaluator'
        rightIcon={<GoTerminal />}
        isActive={drawer === 'evaluator'}
        onClick={() => dispatch(commonDrawerViewChanged('evaluator'))}
      />
      <SideBarButton
        text='Log'
        rightIcon={<GoNote />}
        isActive={drawer === 'log'}
        onClick={() => dispatch(commonDrawerViewChanged('log'))}
      />
    </SideBar>
  );
};

export { AppSideBar };
