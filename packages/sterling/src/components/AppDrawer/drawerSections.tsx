import { ReactElement } from 'react';
import { FaFilm } from 'react-icons/fa';
import { GoNote, GoTerminal } from 'react-icons/go';
import {
  MdFilterCenterFocus,
  MdScience,
  MdWorkspacesOutline
} from 'react-icons/md';
import { VscVariableGroup } from 'react-icons/vsc';
import { useSterlingDispatch, useSterlingSelector } from '../../state/hooks';
import {
  selectDrawerView,
  selectIsSynthesisEnabled,
  selectMainView
} from '../../state/selectors';
import {
  editDrawerViewChanged,
  graphDrawerViewChanged,
  scriptDrawerViewChanged,
  tableDrawerViewChanged
} from '../../state/ui/uiSlice';

// A selectable section of the bottom drawer. `value` matches the drawer-view
// string in the ui slice (e.g. 'state', 'layout', 'explorer'); `label`/`icon`
// mirror the buttons that used to live in the right-hand sidebar.
export interface DrawerSection {
  value: string;
  label: string;
  icon: ReactElement;
}

const TIME: DrawerSection = { value: 'state', label: 'Time', icon: <FaFilm /> };
const PROJECTIONS: DrawerSection = { value: 'projections', label: 'Projections', icon: <MdFilterCenterFocus /> };
const LAYOUT: DrawerSection = { value: 'layout', label: 'Layout', icon: <MdWorkspacesOutline /> };
const SYNTHESIS: DrawerSection = { value: 'synthesis', label: 'Synthesis', icon: <MdScience /> };
const VARIABLES: DrawerSection = { value: 'variables', label: 'Variables', icon: <VscVariableGroup /> };
const EXPLORER: DrawerSection = { value: 'explorer', label: 'Explorer', icon: <FaFilm /> };
const EVALUATOR: DrawerSection = { value: 'evaluator', label: 'Evaluator', icon: <GoTerminal /> };
const LOG: DrawerSection = { value: 'log', label: 'Log', icon: <GoNote /> };

// Explorer / Evaluator / Log are available in every view.
const COMMON = [EXPLORER, EVALUATOR, LOG];

/** Sections available in the bottom drawer for the active main view. */
export function useDrawerSections(): DrawerSection[] {
  const view = useSterlingSelector(selectMainView);
  const synthesisEnabled = useSterlingSelector(selectIsSynthesisEnabled);
  switch (view) {
    case 'GraphView':
      return [
        TIME,
        PROJECTIONS,
        LAYOUT,
        ...(synthesisEnabled ? [SYNTHESIS] : []),
        ...COMMON
      ];
    case 'TableView':
      return [TIME, ...COMMON];
    case 'ScriptView':
      return [VARIABLES, ...COMMON];
    case 'EditView':
      return [TIME, PROJECTIONS, LAYOUT, ...COMMON];
    default:
      return [...COMMON];
  }
}

/** The section currently shown in the drawer (null when collapsed). */
export function useActiveDrawerSection(): string | null {
  return useSterlingSelector(selectDrawerView);
}

/**
 * Returns a dispatcher that opens a drawer section for the active view. Reuses
 * the existing per-view drawer actions, each of which toggles the section off
 * when it is already active — so passing the active section closes the drawer.
 */
export function useSetDrawerSection(): (value: string) => void {
  const dispatch = useSterlingDispatch();
  const view = useSterlingSelector(selectMainView);
  return (value: string) => {
    switch (view) {
      case 'GraphView':
        dispatch(graphDrawerViewChanged(value as any));
        break;
      case 'TableView':
        dispatch(tableDrawerViewChanged(value as any));
        break;
      case 'ScriptView':
        dispatch(scriptDrawerViewChanged(value as any));
        break;
      case 'EditView':
        dispatch(editDrawerViewChanged(value as any));
        break;
    }
  };
}
