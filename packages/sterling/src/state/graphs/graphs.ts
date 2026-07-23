import { GraphLayout } from '@/alloy-graph';
import { CurveDef, GraphProps, ShapeDef } from '@/graph-svg';
import { DatumParsed } from '@/sterling-connection';
import { Projection, SterlingTheme } from '@/sterling-theme';
import { WritableDraft } from 'immer/dist/types/types-external';
import { Matrix } from 'transformation-matrix';
import type { CndProjection, SequencePolicyName } from '../../utils/cndPreParser';

/**
 * How the Time drawer presents trace states:
 * - 'single'  — one state at a time (scrub the timeline).
 * - 'window'  — the state before, the current state, and the state after,
 *               shown side-by-side (a sliding window over the trace).
 * - 'compare' — an arbitrary user-chosen set of states, shown side-by-side.
 */
export type PresentationMode = 'single' | 'window' | 'compare';

/**
 * How side-by-side state panes flow in window/compare mode:
 * - 'horizontal' — left-to-right (a row, wrapping into a grid).
 * - 'vertical'   — top-to-bottom (a single column).
 */
export type ComparisonLayout = 'horizontal' | 'vertical';

export interface GraphsState {
  layoutsByDatumId: Record<
    string,
    {
      // the datum id
      datumId: string;
      // the datum's layouts
      layoutById: Record<string, GraphLayout>;
    }
  >;
  // the transformation matrix associated with each datum
  matricesByDatumId: Record<
    string,
    {
      // the datum id
      datumId: string;
      // the spread matrix
      spreadMatrix: Matrix;
      // the zoom matrix
      zoomMatrix: Matrix;
    }
  >;
  /** If the provider has not provided a generator name, '' will be used */
  themeByGeneratorName: Record<string, SterlingTheme>;
  timeByDatumId: Record<string, number>;

  /** The CnD spec by generator name, so layouts persist across instances */
  cndSpecByGeneratorName: Record<string, string>;

  /**
   * The live, unapplied editing draft of the CnD spec by generator name — what
   * the Layout drawer's editor currently shows. Committed to
   * `cndSpecByGeneratorName` on "Apply Layout". Falls back to the applied spec
   * when absent (see `selectCnDDraftSpec`), so it need not be pre-seeded.
   */
  cndDraftSpecByGeneratorName: Record<string, string>;

  // TODO: Refactor this
  hiddenByDatumId: Record<string, Record<string, string[]>>;
  
  /** 
   * Multi-projection selections by generator name.
   * Maps projection type -> array of selected atom IDs.
   * When multiple atoms are selected for a type, multiple graphs are shown.
   */
  selectedProjectionsByGeneratorName: Record<string, Record<string, string[]>>;
  
  /**
   * Multi-temporal selections by datum ID.
   * Array of selected time indices for comparing multiple time steps.
   * When multiple indices are selected, multiple graphs are shown side-by-side.
   */
  selectedTimeIndicesByDatumId: Record<string, number[]>;

  /**
   * How the Time drawer presents states for each datum. Defaults to 'single'
   * (see selectPresentationMode). Drives which time indices are rendered and
   * which Time-panel controls are shown.
   */
  presentationModeByDatumId: Record<string, PresentationMode>;

  /** Flow direction for side-by-side state panes. Defaults to 'horizontal'. */
  comparisonLayoutByDatumId: Record<string, ComparisonLayout>;

  /**
   * CND-derived projection configurations by generator name.
   * Parsed from the top-level `projections` block of the CND spec.
   */
  projectionConfigByGeneratorName: Record<string, CndProjection[]>;

  /**
   * CND-derived sequence policy by generator name.
   * Parsed from the top-level `sequence` block of the CND spec.
   */
  sequencePolicyByGeneratorName: Record<string, SequencePolicyName>;
}

export interface GraphData {
  // the datum represented by the graph data
  datum: DatumParsed<any>;
  // the graph props (used for rendering)
  graphProps: GraphProps;
  // the time projection type, if one was used
  timeProjection?: string;
}

type Inheritable<T> = {
  value: T;
  inherited: boolean;
};

export interface RelationStyle {
  asAttribute?: boolean;
  sourceIndex?: number;
  targetIndex?: number;
  curve?: Inheritable<CurveDef>;
  stroke?: Inheritable<string>;
  strokeWidth?: Inheritable<number>;
  fontSize?: Inheritable<string>;
  textColor?: Inheritable<string>;
}

export interface TypeStyle {
  shape?: Inheritable<ShapeDef>;
  fill?: Inheritable<string>;
  stroke?: Inheritable<string>;
  strokeWidth?: Inheritable<number>;
  fontSize?: Inheritable<string>;
  textColor?: Inheritable<string>;
}

/**
 * Create a new graphs state.
 */
export function newGraphsState(): GraphsState {
  return {
    layoutsByDatumId: {},
    matricesByDatumId: {},
    themeByGeneratorName: {},
    timeByDatumId: {},
    hiddenByDatumId: {},
    cndSpecByGeneratorName: {},
    cndDraftSpecByGeneratorName: {},
    selectedProjectionsByGeneratorName: {},
    selectedTimeIndicesByDatumId: {},
    presentationModeByDatumId: {},
    comparisonLayoutByDatumId: {},
    projectionConfigByGeneratorName: {},
    sequencePolicyByGeneratorName: {}
  };
}

/**
 * Generate a unique layout id based on the set of projections.
 *
 * @param projections A set of projections
 */
export function generateLayoutId(
  projections: Projection[] | WritableDraft<Projection>[]
): string {
  if (!projections.length) return '|';
  const sorted = projections.slice().sort((a, b) => {
    if (a.time === b.time) return a.type.localeCompare(b.type);
    return a.time === true ? -1 : 1;
  });
  const names = sorted.map((projection) => {
    return projection.time === true
      ? `[${projection.type}]`
      : `(${projection.type})`;
  });
  return names.join('|');
}
