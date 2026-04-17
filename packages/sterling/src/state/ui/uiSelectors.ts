import { createSelector } from '@reduxjs/toolkit';
import {
  GraphDrawerView,
  MainView,
  ScriptDrawerView,
  TableDrawerView,
  UiState
} from './ui';

/**
 * Select the main views available to the user.
 */
function selectAvailableViews(state: UiState): MainView[] {
  return state.availableViews;
}

/**
 * Select the main view.
 */
function selectMainView(state: UiState): MainView {
  return state.mainView;
}

/**
 * Select the graph drawer view.
 */
function selectGraphDrawer(state: UiState): GraphDrawerView | null {
  return state.graphViewDrawer;
}

/**
 * Select the table drawer view.
 */
function selectTableDrawer(state: UiState): TableDrawerView | null {
  return state.tableViewDrawer;
}

/**
 * Select the script drawer view.
 */
function selectScriptDrawer(state: UiState): ScriptDrawerView | null {
  return state.scriptViewDrawer;
}

/**
 * Select the edit drawer view.
 */
function selectEditDrawer(state: UiState): GraphDrawerView | null {
  return state.editViewDrawer;
}

/**
 * Select the open/closed state of the drawer.
 */
const selectDrawerIsCollapsed = createSelector(
  [selectMainView, selectGraphDrawer, selectTableDrawer, selectScriptDrawer, selectEditDrawer],
  (main, graph, table, script, edit) => {
    switch (main) {
      case 'GraphView':
        return graph === null;
      case 'TableView':
        return table === null;
      case 'ScriptView':
        return script === null;
      case 'EditView':
        return edit === null;
      default:
        return true;
    }
  }
);

/**
 * Select the drawer view.
 */
const selectDrawerView = createSelector(
  [selectMainView, selectGraphDrawer, selectTableDrawer, selectScriptDrawer, selectEditDrawer],
  (main, graph, table, script, edit) => {
    switch (main) {
      case 'GraphView':
        return graph;
      case 'TableView':
        return table;
      case 'ScriptView':
        return script;
      case 'EditView':
        return edit;
      default:
        return null;
    }
  }
);

/**
 * The generator name that has been selected in the explorer dropdown.
 */
function selectSelectedGenerator(state: UiState): string | undefined {
  return state.selectedGenerator;
}


export default {
  selectAvailableViews,
  selectMainView,
  selectGraphDrawer,
  selectTableDrawer,
  selectScriptDrawer,
  selectEditDrawer,
  selectDrawerIsCollapsed,
  selectDrawerView,
  selectSelectedGenerator
};
