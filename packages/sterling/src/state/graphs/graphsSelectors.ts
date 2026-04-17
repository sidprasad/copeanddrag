import { GraphLayout } from '@/alloy-graph';
import { DatumParsed } from '@/sterling-connection';
import { Projection, SterlingTheme } from '@/sterling-theme';
import { Matrix } from 'transformation-matrix';
import { generateLayoutId, GraphsState } from './graphs';
import type { CndProjection, SequencePolicyName } from '../../utils/cndPreParser';

/**
 * Select a graph layout associated with a datum.
 */
function selectGraphLayout(
  state: GraphsState,
  datum: DatumParsed<any>
): GraphLayout {
  const projections = selectProjections(state, datum);
  const layouts = state.layoutsByDatumId[datum.id];
  const layoutId = generateLayoutId(projections);
  return layouts.layoutById[layoutId];
}

function selectHiddenRelations(
  state: GraphsState,
  datum: DatumParsed<any>
): Record<string, string[]> {
  return state.hiddenByDatumId[datum.id];
}

/**
 * Return an array of projections associated with a datum.
 */
function selectProjections(
  state: GraphsState,
  datum: DatumParsed<any>
): Projection[] {
  const theme = selectTheme(state, datum);
  return theme ? theme.projections || [] : [];
}

/**
 * Select the spread matrix associated with a datum.
 */
function selectSpreadMatrix(
  state: GraphsState,
  datum: DatumParsed<any>
): Matrix | undefined {
  return state.matricesByDatumId[datum.id]?.spreadMatrix;
}

/**
 * Select the theme associated with a datum. This is indexed by generator name;
 * if the provider has not given generator names, all data are associated with 
 * the same generator (internally named '').
 */
function selectTheme(
  state: GraphsState,
  datum: DatumParsed<any>
): SterlingTheme {
  return state.themeByGeneratorName[datum.generatorName ?? ''];
}

/**
 * Select the current time index for a datum.
 */
function selectTimeIndex(state: GraphsState, datum: DatumParsed<any>): number {
  return state.timeByDatumId[datum.id] || 0;
}

/**
 * Select the zoom matrix associated with a datum.
 */
function selectZoomMatrix(
  state: GraphsState,
  datum: DatumParsed<any>
): Matrix | undefined {
  return state.matricesByDatumId[datum.id]?.zoomMatrix;
}

/**
 * Select the pre-loaded CnD diagram spec, if any.
 * Uses generator name so layouts persist across instances.
 * If no spec is defined, the value will be the empty string.
 */
function selectCnDSpec(
  state: GraphsState,
  datum: DatumParsed<any>
): string {
  const generator = datum.generatorName ?? '';
  return state.cndSpecByGeneratorName[generator] ?? '';
}

/**
 * Select the selected projection atoms for a datum.
 * Returns a record mapping projection type to array of selected atom IDs.
 */
function selectSelectedProjections(
  state: GraphsState,
  datum: DatumParsed<any>
): Record<string, string[]> {
  const generator = datum.generatorName ?? '';
  return state.selectedProjectionsByGeneratorName[generator] ?? {};
}

/**
 * Select the selected time indices for multi-temporal view.
 * Returns an array of time indices to display.
 */
function selectSelectedTimeIndices(
  state: GraphsState,
  datum: DatumParsed<any>
): number[] {
  return state.selectedTimeIndicesByDatumId[datum.id] ?? [];
}

/**
 * Select the CND-derived projection configuration for a datum.
 * These are the projection directives parsed from the top-level `projections`
 * block of the CND spec.
 */
function selectProjectionConfig(
  state: GraphsState,
  datum: DatumParsed<any>
): CndProjection[] {
  const generator = datum.generatorName ?? '';
  return state.projectionConfigByGeneratorName[generator] ?? [];
}

/**
 * Select the CND-derived sequence policy for a datum.
 * Parsed from the top-level `sequence` block of the CND spec.
 * Defaults to 'ignore_history' when not specified.
 */
function selectSequencePolicyName(
  state: GraphsState,
  datum: DatumParsed<any>
): SequencePolicyName {
  const generator = datum.generatorName ?? '';
  return state.sequencePolicyByGeneratorName[generator] ?? 'ignore_history';
}

export default {
  selectGraphLayout,
  selectHiddenRelations,
  selectProjections,
  selectProjectionConfig,
  selectSelectedProjections,
  selectSelectedTimeIndices,
  selectSequencePolicyName,
  selectSpreadMatrix,
  selectTheme,
  selectTimeIndex,
  selectZoomMatrix,
  selectCnDSpec
};
