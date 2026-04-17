import { GraphLayout } from '@/alloy-graph';
import { CurveDef, GraphProps, ShapeDef } from '@/graph-svg';
import { DatumParsed } from '@/sterling-connection';
import { Projection, SterlingTheme } from '@/sterling-theme';
import { WritableDraft } from 'immer/dist/types/types-external';
import { Matrix } from 'transformation-matrix';
import type { CndProjection, SequencePolicyName } from '../../utils/cndPreParser';

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
    selectedProjectionsByGeneratorName: {},
    selectedTimeIndicesByDatumId: {},
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
