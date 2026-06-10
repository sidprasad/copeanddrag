import { ColorMode, resolveInitialColorMode } from '../../theme/colorMode';

export type GraphView = 'GraphView';
export type TableView = 'TableView';
export type ScriptView = 'ScriptView';
export type EditView = 'EditView';
export type MainView = GraphView | TableView | ScriptView | EditView;
export type CommonDrawerView = 'explorer' | 'evaluator' | 'log';
export type GraphDrawerView =
  | CommonDrawerView
  | 'state'
  | 'projections'
  | 'layout'
  | 'synthesis';
export type TableDrawerView = CommonDrawerView | 'state';
export type ScriptDrawerView = CommonDrawerView | 'variables';

export interface UiState {
  // the views available to the user
  availableViews: MainView[];

  // the main view state
  mainView: MainView;

  // the drawer states
  graphViewDrawer: GraphDrawerView | null;
  tableViewDrawer: TableDrawerView | null;
  scriptViewDrawer: ScriptDrawerView | null;
  editViewDrawer: GraphDrawerView | null;

  // the graph view drawer states
  // The generator name selected in the explorer dropdown
  selectedGenerator: string | undefined;

  // active app color mode (light/dark); reflected onto <html> data-theme and
  // synced to the graph's theme
  colorMode: ColorMode;
}

/**
 * Create a new UI state.
 */
export const newUiState = (initialView?: MainView): UiState => {
  // In the Alloy build, start with the explorer drawer closed so the graph
  // gets the full width by default. It can be reopened via the sidebar button.
  const explorerClosedByDefault = process.env.PROVIDER === 'alloy';
  return {
    availableViews: ['GraphView', 'TableView', 'ScriptView', 'EditView'],
    mainView: initialView || 'ScriptView',
    graphViewDrawer: explorerClosedByDefault ? null : 'explorer',
    tableViewDrawer: null,
    scriptViewDrawer: 'variables',
    editViewDrawer: null,
    selectedGenerator: undefined,
    colorMode: resolveInitialColorMode()
  };
};

/**
 * Determine if a string is a common drawer view string.
 */
export function isCommonDrawerView(
  view: string | null
): view is CommonDrawerView {
  return view === 'data' || view === 'evaluator' || view === 'log';
}
