import {
  generateGraph,
  generateGraphProps,
  getInstanceEdgeStyleSpecs,
  getInstanceNodeStyleSpecs,
  GraphLayout,
  layoutGraph
} from '@/alloy-graph';
import {
  applyProjections,
  getInstanceAtomsOfType,
  getInstanceRelations,
  getInstanceRelationsAndSkolems,
  getInstanceType,
  getInstanceTypes,
  getProjectableTypes,
  getRelationTuples,
  getTypeAtoms,
  isAlloyDatumTrace,
  isDefined
} from '@/alloy-instance';
import { getEdges, removeEdge, removeEdges } from '@/graph-lib';
import { GraphProps } from '@/graph-svg';
import { DatumParsed, isDatumAlloy } from '@/sterling-connection';
import { Projection, SterlingTheme } from '@/sterling-theme';
import { createSelector } from '@reduxjs/toolkit';
import { difference, get, keys, pick, set } from 'lodash-es';
import { Matrix } from 'transformation-matrix';
import dataSelectors from './data/dataSelectors';
import { Expression } from './evaluator/evaluator';
import evaluatorSelectors from './evaluator/evaluatorSelectors';
import { RelationStyle, TypeStyle } from './graphs/graphs';
import graphsSelectors from './graphs/graphsSelectors';
import { LogItem } from './log/log';
import logSelectors from './log/logSelectors';
import providerSelectors from './provider/providerSelectors';
import { ScriptStageType, ScriptVariable } from './script/script';
import scriptSelectors from './script/scriptSelectors';
import { SterlingState } from './store';
import { TableData } from './table/table';
import {
  GraphDrawerView,
  MainView,
  ScriptDrawerView,
  TableDrawerView
} from './ui/ui';
import uiSelectors from './ui/uiSelectors';

/**
 * Select the currently active datum.
 */
export function selectActiveDatum(
  state: SterlingState
): DatumParsed<any> | undefined {
  return dataSelectors.selectActiveDatum(state.data);
}

/**
 * Select the currently selected (in the explorer pane) generator.
 */
export function selectSelectedGenerator(
  state: SterlingState
): string | undefined {
  return uiSelectors.selectSelectedGenerator(state.ui);
}


/**
 * Select the available projectable types and their atoms.
 */
export function selectAvailableProjectableTypes(
  state: SterlingState,
  datum: DatumParsed<any>
): Record<string, string[]> {
  const types = selectProjectableTypes(state, datum);
  const projections = selectProjections(state, datum);
  const projected = projections.map((p) => p.type);
  const available = difference(keys(types), projected);
  return pick(types, available);
}

/**
 * Select the main views available to the user.
 */
export function selectAvailableViews(state: SterlingState): MainView[] {
  return uiSelectors.selectAvailableViews(state.ui);
}

/**
 * Select an ordered array of all datum objects.
 */
export function selectData(state: SterlingState): DatumParsed<any>[] {
  return dataSelectors.selectData(state.data);
}

/**
 * Select a datum by its datum id.
 */
export function selectDatumById(
  state: SterlingState,
  datumId: string
): DatumParsed<any> | undefined {
  return dataSelectors.selectDatumById(state.data, datumId);
}

/**
 * Select provider-advertised feature flags.
 */
export function selectProviderFeatures(state: SterlingState): string[] {
  return providerSelectors.selectProviderFeatures(state.provider);
}

/**
 * Select whether a datum is natively stateful, meaning it is a trace.
 */
export function selectDatumIsStateful(
  state: SterlingState,
  datum: DatumParsed<any>
): boolean {
  return selectDatumIsTrace(state, datum);
}

/**
 * Select whether a datum is stateful through projection.
 */
export function selectDatumIsStatefulProjected(
  state: SterlingState,
  datum: DatumParsed<any>
): boolean {
  const projections = selectProjections(state, datum) || [];
  return projections.some((p) => p.time === true);
}

/**
 * Select whether a datum is a trace, meaning it is stateful by default and
 * does not require projections to become stateful.
 */
export function selectDatumIsTrace(
  state: SterlingState,
  datum: DatumParsed<any>
): boolean {
  return isDatumAlloy(datum) && isAlloyDatumTrace(datum.parsed);
}

/**
 * Select the open/closed state of the drawer.
 */
export function selectDrawerIsCollapsed(state: SterlingState) {
  return uiSelectors.selectDrawerIsCollapsed(state.ui);
}

/**
 * Select the drawer view.
 */
export function selectDrawerView(
  state: SterlingState
): GraphDrawerView | TableDrawerView | ScriptDrawerView | null {
  return uiSelectors.selectDrawerView(state.ui);
}

/**
 * Select the graph drawer view.
 */
export function selectGraphDrawer(
  state: SterlingState
): GraphDrawerView | null {
  return uiSelectors.selectGraphDrawer(state.ui);
}

/**
 * Select the edit drawer view.
 */
export function selectEditDrawer(
  state: SterlingState
): GraphDrawerView | null {
  return uiSelectors.selectEditDrawer(state.ui);
}

/**
 * Select the graph layout associated with a datum.
 */
export function selectGraphLayout(
  state: SterlingState,
  datum: DatumParsed<any>
): GraphLayout {
  return graphsSelectors.selectGraphLayout(state.graphs, datum);
}

/**
 * Select a boolean indicating if the currently active datum can use the evaluator.
 */
export function selectEvaluatorIsEnabled(state: SterlingState): boolean {
  const activeDatum = selectActiveDatum(state);
  return activeDatum !== undefined && activeDatum.evaluator === true;
}

/**
 * Select the ordered array of expression associated with a datum.
 */
export function selectEvaluatorExpressions(
  state: SterlingState,
  datum: DatumParsed<any>
): Expression[] {
  return evaluatorSelectors.selectDatumExpressions(state.evaluator, datum);
}

/**
 * Select the connection status.
 */
export function selectIsConnected(state: SterlingState): boolean {
  return providerSelectors.selectIsConnected(state.provider);
}

/**
 * Select all log items.
 */
export function selectLogItems(state: SterlingState): LogItem[] {
  return logSelectors.selectLogItems(state.log);
}

/**
 * Select the loopback index associated with a datum.
 */
export function selectLoopbackIndex(
  state: SterlingState,
  datum: DatumParsed<any>
): number | undefined {
  if (datum && isDatumAlloy(datum) && isAlloyDatumTrace(datum.parsed)) {
    return datum.parsed.loopBack;
  }
  return undefined;
}

/**
 * Select the main view.
 */
export function selectMainView(state: SterlingState): MainView {
  return uiSelectors.selectMainView(state.ui);
}

/**
 * Select the next expression id.
 */
export function selectNextExpressionId(state: SterlingState): number {
  return evaluatorSelectors.selectNextExpressionId(state.evaluator);
}

/**
 * Select all projectable types and their atoms.
 */
export function selectProjectableTypes(
  state: SterlingState,
  datum: DatumParsed<any>
): Record<string, string[]> {
  const projectableTypes: Record<string, string[]> = {};
  if (datum && isDatumAlloy(datum)) {
    const instance = datum.parsed.instances[0];
    getProjectableTypes(instance).forEach((typeId) => {
      const type = getInstanceType(instance, typeId);
      projectableTypes[typeId] = getInstanceAtomsOfType(instance, type).map(
        (a) => a.id
      );
    });
  }
  return projectableTypes;
}

/**
 * Select projections associated with a datum.
 */
export function selectProjections(
  state: SterlingState,
  datum: DatumParsed<any>
): Projection[] {
  return graphsSelectors.selectProjections(state.graphs, datum);
}

/**
 * Select the name of the provider.
 */
export function selectProviderName(state: SterlingState): string {
  return providerSelectors.selectProviderName(state.provider);
}

/**
 * Select the generators that the provider uses. 
 */
export function selectProviderGeneratorNames(state: SterlingState): string[] | undefined {
  return providerSelectors.selectProviderGeneratorNames(state.provider);
}

/**
 * Select all relations from a datum.
 */
export function selectRelations(
  state: SterlingState,
  datum: DatumParsed<any>
): string[] {
  if (isDatumAlloy(datum)) {
    const instance = datum.parsed.instances[0];
    const relations = getInstanceRelations(instance);
    return relations.map((relation) => relation.name);
  }
  return [];
}

/**
 * Select the script drawer view.
 */
export function selectScriptDrawer(
  state: SterlingState
): ScriptDrawerView | null {
  return uiSelectors.selectScriptDrawer(state.ui);
}

/**
 * Select the current stage type.
 */
export function selectScriptStage(state: SterlingState): ScriptStageType {
  return scriptSelectors.selectScriptStage(state.script);
}

/**
 * Select the dimensions of the script stage.
 */
export function selectScriptStageDimensions(state: SterlingState): {
  width: number;
  height: number;
} {
  return scriptSelectors.selectScriptStageDimensions(state.script);
}

/**
 * Select the current script text.
 */
export function selectScriptText(state: SterlingState): string {
  return scriptSelectors.selectScriptText(state.script);
}

/**
 * Select the spread matrix associated with a datum.
 */
export function selectSpreadMatrix(
  state: SterlingState,
  datum: DatumParsed<any>
): Matrix | undefined {
  return graphsSelectors.selectSpreadMatrix(state.graphs, datum);
}

/**
 * Select the table drawer view.
 */
export function selectTableDrawer(
  state: SterlingState
): TableDrawerView | null {
  return uiSelectors.selectTableDrawer(state.ui);
}

/**
 * Select the theme associated with a datum id.
 */
export function selectTheme(
  state: SterlingState,
  datum: DatumParsed<any>
): SterlingTheme {
  return graphsSelectors.selectTheme(state.graphs, datum);
}

/**
 * Select the time index associated with a datum.
 */
export function selectTimeIndex(
  state: SterlingState,
  datum: DatumParsed<any>
): number {
  return graphsSelectors.selectTimeIndex(state.graphs, datum);
}

/**
 * Select the total length of the trace.
 * TODO: The naming (trace) is confusing, need to decide for consistency
 */
export function selectTraceLength(
  state: SterlingState,
  datum: DatumParsed<any>
): number {
  if (isDatumAlloy(datum) && isAlloyDatumTrace(datum.parsed)) {
    return datum.parsed.instances.length;
  }
  return 1;
}

/**
 * Select the displayable styles associated with a datum's relation.
 */
export function selectRelationStyle(
  state: SterlingState,
  datum: DatumParsed<any>,
  relationId: string
): RelationStyle {
  if (isDatumAlloy(datum)) {
    const instance = datum.parsed.instances[0];
    const theme = selectTheme(state, datum);
    const specs = getInstanceEdgeStyleSpecs(instance, theme);

    const style: RelationStyle = {};
    const relations = ['*', relationId];
    relations.forEach((relation) => {
      specs[relation].forEach((spec) => {
        
        const asAttribute = get(spec, ['asAttribute']);
        const sourceIndex = get(spec, ['sourceIndex']);
        const targetIndex = get(spec, ['targetIndex']);
        
        const curve = get(spec, ['curve']);
        const stroke = get(spec, ['styles', 'edge', 'stroke']);
        const strokeWidth = get(spec, ['styles', 'edge', 'strokeWidth']);
        const fontSize = get(spec, ['styles', 'label', 'fontSize']);
        const textColor = get(spec, ['styles', 'label', 'fill']);

        set(style, ['asAttribute'], asAttribute === true);
        set(style, ['sourceIndex'], sourceIndex);
        set(style, ['targetIndex'], targetIndex);
        if (curve) {
          set(style, ['curve', 'value'], curve);
          set(style, ['curve', 'inherited'], relation !== relationId);
        }
        if (stroke) {
          set(style, ['stroke', 'value'], stroke);
          set(style, ['stroke', 'inherited'], relation !== relationId);
        }
        if (strokeWidth) {
          set(style, ['strokeWidth', 'value'], strokeWidth);
          set(style, ['strokeWidth', 'inherited'], relation !== relationId);
        }
        if (fontSize) {
          set(style, ['fontSize', 'value'], fontSize);
          set(style, ['fontSize', 'inherited'], relation !== relationId);
        }
        if (textColor) {
          set(style, ['textColor', 'value'], textColor);
          set(style, ['textColor', 'inherited'], relation !== relationId);
        }
      });
    });

    return style;
  }
  return {};
}

/**
 * Select the displayable styles associated with a datum's type.
 */
export function selectTypeStyle(
  state: SterlingState,
  datum: DatumParsed<any>,
  typeId: string
): TypeStyle {
  if (isDatumAlloy(datum)) {
    const instance = datum.parsed.instances[0];
    const theme = selectTheme(state, datum);
    const specs = getInstanceNodeStyleSpecs(instance, theme);

    const style: TypeStyle = {};
    const type = getInstanceType(instance, typeId);
    const hierarchy = ['*', 'univ', ...type.types.slice().reverse()];

    hierarchy.forEach((type) => {
      specs[type].forEach((spec) => {
        const shape = get(spec, ['shape']);
        const fill = get(spec, ['styles', 'node', 'fill']);
        const stroke = get(spec, ['styles', 'node', 'stroke']);
        const strokeWidth = get(spec, ['styles', 'node', 'strokeWidth']);
        const fontSize = get(spec, ['styles', 'label', 'fontSize']);
        const textColor = get(spec, ['styles', 'label', 'fill']);
        if (shape) {
          set(style, ['shape', 'value'], shape);
          set(style, ['shape', 'inherited'], type !== typeId);
        }
        if (fill) {
          set(style, ['fill', 'value'], fill);
          set(style, ['fill', 'inherited'], type !== typeId);
        }
        if (stroke) {
          set(style, ['stroke', 'value'], stroke);
          set(style, ['stroke', 'inherited'], type !== typeId);
        }
        if (strokeWidth) {
          set(style, ['strokeWidth', 'value'], strokeWidth);
          set(style, ['strokeWidth', 'inherited'], type !== typeId);
        }
        if (fontSize) {
          set(style, ['fontSize', 'value'], fontSize);
          set(style, ['fontSize', 'inherited'], type !== typeId);
        }
        if (textColor) {
          set(style, ['textColor', 'value'], textColor);
          set(style, ['textColor', 'inherited'], type !== typeId);
        }
      });
    });
    return style;
  }
  return {};
}

/**
 * Select the zoom matrix associated with a datum.
 */
export function selectZoomMatrix(
  state: SterlingState,
  datum: DatumParsed<any>
): Matrix | undefined {
  return graphsSelectors.selectZoomMatrix(state.graphs, datum);
}

export function selectHiddenRelations(
  state: SterlingState,
  datum: DatumParsed<any>
): Record<string, string[]> {
  return graphsSelectors.selectHiddenRelations(state.graphs, datum);
}

/**
 * Select the GraphProps associated with a datum, where GraphProps
 * are everything required to render a graph.
 */
export const selectGraphProps = createSelector(
  [
    (state, datum?: DatumParsed<any>) => datum,
    (state, datum?: DatumParsed<any>) =>
      datum ? selectGraphLayout(state, datum) : undefined,
    (state, datum?: DatumParsed<any>) =>
      datum ? selectTheme(state, datum) : undefined,
    (state, datum?: DatumParsed<any>) =>
      datum ? selectTimeIndex(state, datum) : undefined,
    (state, datum?: DatumParsed<any>) =>
      datum ? selectHiddenRelations(state, datum) : undefined
  ],
  (datum, layout, theme, time, hidden): GraphProps[] => {
    if (
      datum &&
      layout &&
      theme &&
      time !== undefined &&
      isDatumAlloy(datum) &&
      hidden
    ) {
      const instance = datum.parsed.instances[time];      
      const projections = theme.projections || [];
      const timeProjections = projections.filter((p) => p.time === true);

      const atoms = projections.map((p) => p.atom).filter(isDefined);
      const projected = applyProjections(instance, atoms);
      const graph = generateGraph(projected, theme);

      if (timeProjections.length) {
        return timeProjections.map((projection) => {
          let tpgraph = graph;
          const hiddenRelations = hidden[projection.type];
          if (hiddenRelations) {
            hidden[projection.type].forEach((hiddenRelation) => {
              const toremove = getEdges(tpgraph)
                .filter((edge) => edge.relation.name === hiddenRelation)
                .map((edge) => edge.id);
              tpgraph = removeEdges(graph, toremove);
            });
          }

          const graphPositioned = layoutGraph(tpgraph, layout);
          return generateGraphProps('', projected, graphPositioned, theme);
        });
      }

      const graphPositioned = layoutGraph(graph, layout);
      const graphProps = generateGraphProps(
        '',
        projected,
        graphPositioned,
        theme
      );

      return [graphProps];
    } else {
      console.log(`datum: ${datum !== undefined}`);
      console.log(`layout: ${layout !== undefined}`);
      console.log(`theme: ${theme !== undefined}`);
      console.log(`time: ${time}`);
      return [];
    }
  }
);

export const selectScriptVariables = createSelector(
  [
    (state, datum: DatumParsed<any>) => datum,
    (state, datum: DatumParsed<any>) => selectProjections(state, datum),
    (state, datum: DatumParsed<any>) => selectTimeIndex(state, datum)
  ],
  (datum, projections, time): ScriptVariable[] => {
    return scriptSelectors.selectScriptVariables(datum, projections, time);
  }
);

export const selectTables = createSelector(
  [
    (state, datum: DatumParsed<any>) => datum,
    (state, datum: DatumParsed<any>) => selectTimeIndex(state, datum)
  ],
  (datum, time) => {
    if (isDatumAlloy(datum)) {
      const instance = datum.parsed.instances[time];
      // Show Skolem relations alongside field relations
      const relations: TableData[] = getInstanceRelationsAndSkolems(instance).map(
        (relation) => {
          return {
            title: relation.name,
            type: 'relation',
            headers: relation.types,
            data: getRelationTuples(relation).map((tuple) => {
              return tuple.atoms;
            })
          };
        }
      );
      const types: TableData[] = getInstanceTypes(instance).map((type) => {
        return {
          title: type.id,
          type: 'type',
          data: getTypeAtoms(type).map((atom) => [atom.id])
        };
      });
      return [...relations, ...types];
    }
    return [];
  }
);


/**
 * Select the pre-loaded CnD spec, if any. 
 * NOTE WELL: this will not persist changes in the Layout window as of June 2025. 
 */
export function selectCnDSpec(
  state: SterlingState,
  datum: DatumParsed<any>
): string {
  return graphsSelectors.selectCnDSpec(state.graphs, datum);
}

/**
 * Select the selected projections for multi-projection view.
 * Returns a record mapping projection type to array of selected atom IDs.
 */
export function selectSelectedProjections(
  state: SterlingState,
  datum: DatumParsed<any>
): Record<string, string[]> {
  return graphsSelectors.selectSelectedProjections(state.graphs, datum);
}

/**
 * Select the selected time indices for multi-temporal view.
 * Returns an array of time indices to display side-by-side.
 */
export function selectSelectedTimeIndices(
  state: SterlingState,
  datum: DatumParsed<any>
): number[] {
  return graphsSelectors.selectSelectedTimeIndices(state.graphs, datum);
}

/**
 * Select the CND-derived projection configuration for a datum.
 * Projections parsed from the top-level `projections` block of the CND spec.
 */
export function selectProjectionConfig(
  state: SterlingState,
  datum: DatumParsed<any>
) {
  return graphsSelectors.selectProjectionConfig(state.graphs, datum);
}

/**
 * Select the CND-derived sequence policy name for a datum.
 * Parsed from the top-level `sequence` block of the CND spec.
 */
export function selectSequencePolicyName(
  state: SterlingState,
  datum: DatumParsed<any>
) {
  return graphsSelectors.selectSequencePolicyName(state.graphs, datum);
}

/**
 * Synthesis mode selectors
 */
export function selectIsSynthesisEnabled(state: SterlingState): boolean {
  return providerSelectors.selectIsSynthesisEnabled(state.provider);
}

export function selectIsSynthesisActive(state: SterlingState): boolean {
  return state.synthesis.isActive;
}

export function selectSynthesisSelectorType(state: SterlingState) {
  return state.synthesis.selectorType;
}

export function selectSynthesisStep(state: SterlingState): number {
  return state.synthesis.currentStep;
}

export function selectSynthesisNumInstances(state: SterlingState): number {
  return state.synthesis.numInstances;
}

export function selectSynthesisExamples(state: SterlingState) {
  return state.synthesis.examples;
}

export function selectSynthesisInstances(state: SterlingState) {
  return state.synthesis.loadedInstances;
}

export function selectSynthesisResult(state: SterlingState) {
  return state.synthesis.result;
}

export function selectSynthesisError(state: SterlingState) {
  return state.synthesis.error;
}

export function selectSynthesisLoading(state: SterlingState): boolean {
  return state.synthesis.isLoading;
}

export function selectCanSynthesize(state: SterlingState): boolean {
  return (
    !state.synthesis.isLoading &&
    state.synthesis.examples.length === state.synthesis.numInstances &&
    state.synthesis.examples.every((ex: any) => ex.selectedAtomIds.length > 0 || ex.selectedPairs.length > 0)
  );
}

export function selectSynthesisDraftAtomIds(state: SterlingState): string[] {
  return state.synthesis.draftSelection.atomIds;
}

export function selectSynthesisDraftPairs(state: SterlingState): [string, string][] {
  return state.synthesis.draftSelection.pairs;
}

export function selectSynthesisCurrentDataInstance(state: SterlingState): any | null {
  return state.synthesis.currentDataInstance;
}
