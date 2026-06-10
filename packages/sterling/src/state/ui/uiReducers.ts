import { PayloadAction } from '@reduxjs/toolkit';
import { ColorMode } from '../../theme/colorMode';
import {
  CommonDrawerView,
  GraphDrawerView,
  MainView,
  ScriptDrawerView,
  TableDrawerView,
  UiState
} from './ui';

/**
 * Display an edit view drawer or hide the drawer.
 * Reuses GraphDrawerView since the edit view shares the same drawer types.
 */
function editDrawerViewChanged(
  state: UiState,
  action: PayloadAction<GraphDrawerView>
) {
  const view = action.payload;
  state.editViewDrawer = view === state.editViewDrawer ? null : view;
}

/**
 * Set the main UI view (graph/table/script)
 */
function mainViewChanged(state: UiState, action: PayloadAction<MainView>) {
  state.mainView = action.payload;
}

/**
 * Display a common drawer view (evaluator/log) or hide the drawer.
 */
function commonDrawerViewChanged(
  state: UiState,
  action: PayloadAction<CommonDrawerView>
) {
  const view = action.payload;
  switch (state.mainView) {
    case 'GraphView':
      state.graphViewDrawer = view === state.graphViewDrawer ? null : view;
      break;
    case 'TableView':
      state.tableViewDrawer = view === state.tableViewDrawer ? null : view;
      break;
    case 'ScriptView':
      state.scriptViewDrawer = view === state.scriptViewDrawer ? null : view;
      break;
    case 'EditView':
      state.editViewDrawer = view === state.editViewDrawer ? null : view;
      break;
  }
}

/**
 * Display a graph drawer view or hide the drawer.
 */
function graphDrawerViewChanged(
  state: UiState,
  action: PayloadAction<GraphDrawerView>
) {
  const view = action.payload;
  state.graphViewDrawer = view === state.graphViewDrawer ? null : view;
}

/**
 * Display a table drawer view or hide the drawer.
 */
function tableDrawerViewChanged(
  state: UiState,
  action: PayloadAction<TableDrawerView>
) {
  const view = action.payload;
  state.tableViewDrawer = view === state.tableViewDrawer ? null : view;
}

/**
 * Display a script drawer view or hide the drawer.
 */
function scriptDrawerViewChanged(
  state: UiState,
  action: PayloadAction<ScriptDrawerView>
) {
  const view = action.payload;
  state.scriptViewDrawer = view === state.scriptViewDrawer ? null : view;
}

/**
 * The generator selection has changed in the explorer dropdown.
 */
function selectedGeneratorChanged(
  state: UiState,
  action: PayloadAction<{generatorName: string}>
) {
  const view = action.payload;
  state.selectedGenerator = view.generatorName
}

/** Set the active color mode (e.g. when synced from the graph's theme). */
function colorModeSet(state: UiState, action: PayloadAction<ColorMode>) {
  state.colorMode = action.payload;
}

/** Toggle the active color mode (the in-app light/dark switch). */
function colorModeToggled(state: UiState) {
  state.colorMode = state.colorMode === 'dark' ? 'light' : 'dark';
}



export default {
  mainViewChanged,
  commonDrawerViewChanged,
  graphDrawerViewChanged,
  tableDrawerViewChanged,
  scriptDrawerViewChanged,
  editDrawerViewChanged,
  selectedGeneratorChanged,
  colorModeSet,
  colorModeToggled
};
