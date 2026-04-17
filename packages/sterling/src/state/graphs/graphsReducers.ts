import { generateGraph, generateLayout } from '@/alloy-graph';
import {
  applyProjections,
  getInstanceType,
  getTypeAtoms,
  isDefined
} from '@/alloy-instance';
import { CurveDef, ShapeDef } from '@/graph-svg';
import { DatumParsed, isDatumAlloy } from '@/sterling-connection';
import {
  EdgeStyleSpec,
  NodeStyleSpec,
  Projection,
  SterlingTheme
} from '@/sterling-theme';
import { add, Vector2 } from '@/vector2';
import { current, PayloadAction } from '@reduxjs/toolkit';
import { produce, castDraft } from 'immer';
import { WritableDraft } from 'immer/dist/types/types-external';
import { forEach, remove, set, unset } from 'lodash-es';
import { Matrix } from 'transformation-matrix';
import { generateLayoutId, GraphsState } from './graphs';
import { DEFAULT_LAYOUT_SETTINGS } from './graphsDefaults';
import { LiteralUnion } from 'prettier';
import { parseCndFile } from '../../utils/cndPreParser';

/**
 * An Immer draft of a GraphsState object, so that we can "mutate" the state
 * rather than build a new one in our reducers.
 */
type DraftState = WritableDraft<GraphsState>;

function asAttributeSet(
  state: DraftState,
  action: PayloadAction<{
    datum: DatumParsed<any>;
    relation: string;
    asAttribute: boolean;
  }>
) {
  const { datum, relation, asAttribute } = action.payload;
  const theme = state.themeByGeneratorName[datum.generatorName ?? ''];
  if (theme) {
    // get the edge style spec where the given type is the only target
    const spec = getEdgeStyleSpecUnique(theme, relation);

    if (spec) {
      if (asAttribute) {
        set(spec, ['asAttribute'], true);
      } else {
        unset(spec, ['asAttribute']);
      }
    } else if (asAttribute) {
      const newSpec: EdgeStyleSpec = {
        targets: [{ relation }],
        asAttribute: true
      };

      if (!theme.edges) theme.edges = [];
      theme.edges.push(castDraft(newSpec));
    }
  }
}

function edgeIndexSet(
  state: DraftState,
  action: PayloadAction<{
    datum: DatumParsed<any>;
    relation: string;
    which: 'sourceIndex' | 'targetIndex';
    value: number
  }>
) {
  const { datum, relation, which, value } = action.payload;
  const theme = state.themeByGeneratorName[datum.generatorName ?? ''];
  if (theme) {
    const spec = getEdgeStyleSpecUnique(theme, relation);

    if (spec) {
        set(spec, [which], value);
    } else {
      const newSpec: EdgeStyleSpec = {
        targets: [{ relation }]
      };
      newSpec[which] = value
      if (!theme.edges) theme.edges = [];
      theme.edges.push(castDraft(newSpec));
    }
    // This call will re-generate the layout around the new source/target indexes
    validateLayouts(state, datum);
  }
}
function edgeIndexRemoved(
  state: DraftState,
  action: PayloadAction<{ datum: DatumParsed<any>; relation: string; which: string; }>
) {
  const { datum, relation, which } = action.payload;
  const theme = state.themeByGeneratorName[datum.generatorName ?? ''];
  if (theme) {
    const spec = getEdgeStyleSpecUnique(theme, relation);
    if (spec) unset(spec, [which]);
  }
}


function curveRemoved(
  state: DraftState,
  action: PayloadAction<{ datum: DatumParsed<any>; relation: string }>
) {
  const { datum, relation } = action.payload;
  const theme = state.themeByGeneratorName[datum.generatorName ?? ''];
  if (theme) {
    // get the edge style spec where the given type is the only target
    const spec = getEdgeStyleSpecUnique(theme, relation);

    // if there is one, unset the curve
    if (spec) unset(spec, ['curve']);
  }
}

function curveSet(
  state: DraftState,
  action: PayloadAction<{
    datum: DatumParsed<any>;
    relation: string;
    curve: CurveDef;
  }>
) {
  const { datum, relation, curve } = action.payload;
  const theme = state.themeByGeneratorName[datum.generatorName ?? ''];
  if (theme) {
    // get the edge style spec where the given relation in the only target
    const spec = getEdgeStyleSpecUnique(theme, relation);

    if (spec) {
      // if there is one, set the new value
      set(spec, ['curve'], curve);
    } else {
      // if there isn't one, create a new one and add it to the array of edge
      // style specs (creating the array if it doesn't exist)
      const newSpec: EdgeStyleSpec = {
        targets: [{ relation }],
        curve
      };

      if (!theme.edges) theme.edges = [];
      theme.edges.push(castDraft(newSpec));
    }
  }
}

function edgeLabelStyleRemoved(
  state: DraftState,
  action: PayloadAction<{
    datum: DatumParsed<any>;
    relation: string;
    style: string;
  }>
) {
  const { datum, relation, style } = action.payload;
  const theme = state.themeByGeneratorName[datum.generatorName ?? ''];
  if (theme) {
    // get the node style spec where the given type is the only target
    const spec = getEdgeStyleSpecUnique(theme, relation);

    // if there is one, unset the given style
    if (spec) unset(spec, ['styles', 'label', style]);
  }
}

function edgeLabelStyleSet(
  state: DraftState,
  action: PayloadAction<{
    datum: DatumParsed<any>;
    relation: string;
    style: string;
    value: any;
  }>
) {
  const { datum, relation, style, value } = action.payload;
  const theme = state.themeByGeneratorName[datum.generatorName ?? ''];
  if (theme) {
    // get the node style spec where the given type is the only target
    const spec = getEdgeStyleSpecUnique(theme, relation);

    if (spec) {
      // if there is one, set the new value
      set(spec, ['styles', 'label', style], value);
    } else {
      // if there isn't one, create a new one and add it to the array of node
      // style specs (creating the array if that doesn't exist)
      const newSpec: EdgeStyleSpec = {
        targets: [{ relation }],
        styles: {
          label: {
            [style]: value
          }
        }
      };

      if (!theme.edges) theme.edges = [];
      theme.edges.push(castDraft(newSpec));
    }
  }
}

function edgeStyleRemoved(
  state: DraftState,
  action: PayloadAction<{
    datum: DatumParsed<any>;
    relation: string;
    style: string;
  }>
) {
  const { datum, relation, style } = action.payload;
  const theme = state.themeByGeneratorName[datum.generatorName ?? ''];
  if (theme) {
    // get the edge style spec where the given relation is the only target
    const spec = getEdgeStyleSpecUnique(theme, relation);

    // if there is one, unset the given style
    if (spec) unset(spec, ['styles', 'edge', style]);
  }
}

function edgeStyleSet(
  state: DraftState,
  action: PayloadAction<{
    datum: DatumParsed<any>;
    relation: string;
    style: string;
    value: any;
  }>
) {
  const { datum, relation, style, value } = action.payload;
  const theme = state.themeByGeneratorName[datum.generatorName ?? ''];
  
  if (theme) {
    // get the edge style spec where the given relation is the only target
    const spec = getEdgeStyleSpecUnique(theme, relation);

    if (spec) {
      // if there is one, set the new value
      // console.log(`edgeStyleSet spec: ${relation}: ${style}=${value}`)
      set(spec, ['styles', 'edge', style], value);
    } else {
      // if there isn't one, create a new one and add it to the array of edge
      // style specs (creating the array if it doesn't exist)
      const newSpec: EdgeStyleSpec = {
        targets: [{ relation }],
        styles: {
          edge: {
            [style]: value
          }
        }
      };

      if (!theme.edges) theme.edges = [];
      theme.edges.push(castDraft(newSpec));
    }
  }
}

/**
 * Set the spread matrix for a datum.
 */
function graphSpread(
  state: DraftState,
  action: PayloadAction<{ datum: DatumParsed<any>; matrix: Matrix }>
) {
  const { datum, matrix } = action.payload;
  const matrices = state.matricesByDatumId[datum.id];
  if (matrices) {
    matrices.spreadMatrix = matrix;
  }
}

/**
 * Set the zoom matrix for a datum.
 */
function graphZoomed(
  state: DraftState,
  action: PayloadAction<{ datum: DatumParsed<any>; matrix: Matrix }>
) {
  const { datum, matrix } = action.payload;
  const matrices = state.matricesByDatumId[datum.id];
  if (matrices) {
    matrices.zoomMatrix = matrix;
  }
}

/**
 * TODO: Remove during refactor
 * @param state
 * @param action
 */
function hiddenRelationAdded(
  state: DraftState,
  action: PayloadAction<{
    datum: DatumParsed<any>;
    type: string;
    relation: string;
  }>
) {
  const { datum, type, relation } = action.payload;
  if (!state.hiddenByDatumId[datum.id][type])
    state.hiddenByDatumId[datum.id][type] = [];
  state.hiddenByDatumId[datum.id][type].push(relation);
}

/**
 * Unset the value of a specific label prop for a single type associated with a datum.
 */
function nodeLabelPropRemoved(
  state: DraftState,
  action: PayloadAction<{ datum: DatumParsed<any>; type: string; prop: string }>
) {
  const { datum, type, prop } = action.payload;
  const theme = state.themeByGeneratorName[datum.generatorName ?? ''];
  if (theme) {
    // get the node style spec where the given type is the only target
    const spec = getNodeStyleSpecUnique(theme, type);

    // if there is one, unset the given prop
    if (spec) unset(spec, ['props', 'label', prop]);
  }
}

/**
 * Unset the value of a specific shape style for a single type associated with a datum.
 */
function nodeLabelStyleRemoved(
  state: DraftState,
  action: PayloadAction<{
    datum: DatumParsed<any>;
    type: string;
    style: string;
  }>
) {
  const { datum, type, style } = action.payload;
  const theme = state.themeByGeneratorName[datum.generatorName ?? ''];
  if (theme) {
    // get the node style spec where the given type is the only target
    const spec = getNodeStyleSpecUnique(theme, type);

    // if there is one, unset the given style
    if (spec) unset(spec, ['styles', 'label', style]);
  }
}

/**
 * Set the value of a specific shape style for a single type associated with a datum.
 */
function nodeLabelStyleSet(
  state: DraftState,
  action: PayloadAction<{
    datum: DatumParsed<any>;
    type: string;
    style: string;
    value: any;
  }>
) {
  const { datum, type, style, value } = action.payload;
  const theme = state.themeByGeneratorName[datum.generatorName ?? ''];
  if (theme) {
    // get the node style spec where the given type is the only target
    const spec = getNodeStyleSpecUnique(theme, type);

    if (spec) {
      // if there is one, set the new value
      set(spec, ['styles', 'label', style], value);
    } else {
      // if there isn't one, create a new one and add it to the array of node
      // style specs (creating the array if that doesn't exist)
      const newSpec: NodeStyleSpec = {
        targets: [{ type }],
        styles: {
          label: {
            [style]: value
          }
        }
      };

      if (!theme.nodes) theme.nodes = [];
      theme.nodes.push(castDraft(newSpec));
    }
  }
}

function nodesOffset(
  state: DraftState,
  action: PayloadAction<{
    datum: DatumParsed<any>;
    offsets: Record<string, Vector2>;
  }>
) {
  const { datum, offsets } = action.payload;
  const theme = state.themeByGeneratorName[datum.generatorName ?? ''];
  const projections = theme ? theme.projections || [] : [];
  const layoutId = generateLayoutId(projections);
  const layout = state.layoutsByDatumId[datum.id].layoutById[layoutId];
  forEach(offsets, (offset, nodeId) => {
    const position = layout.nodePositions[nodeId];
    layout.nodePositions[nodeId] = add(position, offset);
  });
}

/**
 * set the value of a specific label prop for a single type associated with a datum.
 */
function nodeLabelPropSet(
  state: DraftState,
  action: PayloadAction<{
    datum: DatumParsed<any>;
    type: string;
    prop: string;
    value: any;
  }>
) {
  const { datum, type, prop, value } = action.payload;
  const theme = state.themeByGeneratorName[datum.generatorName ?? ''];

  if (theme) {
    // get the node style spec where the given type is the only target
    const spec = getNodeStyleSpecUnique(theme, type);

    if (spec) {
      // if there is one, set the new value
      set(spec, ['props', 'label', prop], value);
    } else {
      // if there isn't one, create a new one and add it to the array of node
      // style specs (creating the array if that doesn't exist)
      const newSpec: NodeStyleSpec = {
        targets: [{ type }],
        props: {
          label: {
            [prop]: value
          }
        }
      };

      if (!theme.nodes) theme.nodes = [];
      theme.nodes.push(castDraft(newSpec));
    }
  }
}

/**
 * Add a projection for a datum.
 */
function projectionAdded(
  state: DraftState,
  action: PayloadAction<{
    datum: DatumParsed<any>;
    type: string;
    atom: string;
    time?: boolean;
    timeOrdering?: string;
  }>
) {
  const { datum, type, atom, time, timeOrdering } = action.payload;

  const projection: Projection = {
    type,
    atom,
    time,
    timeOrdering
  };
  const theme = state.themeByGeneratorName[datum.generatorName ?? ''];
  if (theme.projections) {
    theme.projections.push(castDraft(projection));
  } else {
    theme.projections = [castDraft(projection)];
  }
  // Generate new layout
  validateLayouts(state, datum);
}

/**
 * Set the relation that defines the total ordering for a projection.
 */
function projectionOrderingSet(
  state: DraftState,
  action: PayloadAction<{
    datum: DatumParsed<any>;
    type: string;
    relation: string | undefined;
  }>
) {
  const { datum, type, relation } = action.payload;

  const theme = state.themeByGeneratorName[datum.generatorName ?? ''];
  const projections = theme ? theme.projections || [] : [];
  const projection = projections.find((p) => p.type === type);
  if (projection) {
    if (relation) {
      projection.timeOrdering = relation;
    } else {
      delete projection.timeOrdering;
    }
  }
}

/**
 * Remove a projected type for a datum.
 */
function projectionRemoved(
  state: DraftState,
  action: PayloadAction<{ datum: DatumParsed<any>; type: string }>
) {
  const { datum, type } = action.payload;

  const theme = state.themeByGeneratorName[datum.generatorName ?? ''];
  if (theme.projections) {
    remove(theme.projections, (p) => p.type === type);
  }
  // Generate new layout
  validateLayouts(state, datum);
}

function saveThemeRequested(
  state: DraftState,
  action: PayloadAction<{ datum: DatumParsed<any> }>
) {
  const { datum } = action.payload;
  const theme = state.themeByGeneratorName[datum.generatorName ?? ''];
  if (theme) {
    const snapshot = current(theme);
    const cleaned = produce(snapshot, (draft) => {
      draft.projections?.forEach((projection) => {
        unset(projection, 'atom');
      });
    });
    const data = JSON.stringify(cleaned, null, 2);
    const a = document.createElement('a');
    const file = new Blob([data], { type: 'application/json' });
    a.href = URL.createObjectURL(file);
    a.download = 'theme.json';
    a.click();
  }
}

/**
 * Set the projected atom of a certain type for a datum.
 */
function projectionSet(
  state: DraftState,
  action: PayloadAction<{ datum: DatumParsed<any>; type: string; atom: string }>
) {
  const { datum, type, atom } = action.payload;

  const theme = state.themeByGeneratorName[datum.generatorName ?? ''];
  const projections = theme ? theme.projections || [] : [];
  const projection = projections.find((p) => p.type === type);
  if (projection) {
    projection.atom = atom;
  }
  // Generate new layout
  validateLayouts(state, datum);
}

/**
 * Set the selected projections for a type (for multi-projection view).
 * This allows selecting multiple atoms for a projection type.
 */
function selectedProjectionsSet(
  state: DraftState,
  action: PayloadAction<{ 
    datum: DatumParsed<any>; 
    projectionType: string;
    selectedAtoms: string[];
  }>
) {
  const { datum, projectionType, selectedAtoms } = action.payload;
  const generatorName = datum.generatorName ?? '';
  
  if (!state.selectedProjectionsByGeneratorName[generatorName]) {
    state.selectedProjectionsByGeneratorName[generatorName] = {};
  }
  state.selectedProjectionsByGeneratorName[generatorName][projectionType] = selectedAtoms;
}

/**
 * Toggle a single projection atom selection for a type.
 */
function projectionAtomToggled(
  state: DraftState,
  action: PayloadAction<{ 
    datum: DatumParsed<any>; 
    projectionType: string;
    atomId: string;
  }>
) {
  const { datum, projectionType, atomId } = action.payload;
  const generatorName = datum.generatorName ?? '';
  
  if (!state.selectedProjectionsByGeneratorName[generatorName]) {
    state.selectedProjectionsByGeneratorName[generatorName] = {};
  }
  if (!state.selectedProjectionsByGeneratorName[generatorName][projectionType]) {
    state.selectedProjectionsByGeneratorName[generatorName][projectionType] = [];
  }
  
  const currentSelections = state.selectedProjectionsByGeneratorName[generatorName][projectionType];
  const index = currentSelections.indexOf(atomId);
  
  if (index === -1) {
    // Add the atom
    currentSelections.push(atomId);
  } else {
    // Remove the atom
    currentSelections.splice(index, 1);
  }
}

/**
 * Set the selected time indices for multi-temporal view.
 * Allows viewing multiple time steps side-by-side.
 */
function selectedTimeIndicesSet(
  state: DraftState,
  action: PayloadAction<{ 
    datum: DatumParsed<any>; 
    selectedIndices: number[];
  }>
) {
  const { datum, selectedIndices } = action.payload;
  state.selectedTimeIndicesByDatumId[datum.id] = selectedIndices;
}

/**
 * Toggle a single time index selection for multi-temporal view.
 */
function timeIndexToggled(
  state: DraftState,
  action: PayloadAction<{ 
    datum: DatumParsed<any>; 
    index: number;
  }>
) {
  const { datum, index } = action.payload;
  
  if (!state.selectedTimeIndicesByDatumId[datum.id]) {
    state.selectedTimeIndicesByDatumId[datum.id] = [];
  }
  
  const currentSelections = state.selectedTimeIndicesByDatumId[datum.id];
  const idx = currentSelections.indexOf(index);
  
  if (idx === -1) {
    // Add the time index (keep sorted for consistent display)
    currentSelections.push(index);
    currentSelections.sort((a, b) => a - b);
  } else {
    // Remove the time index (but keep at least one)
    if (currentSelections.length > 1) {
      currentSelections.splice(idx, 1);
    }
  }
}

function shapeRemoved(
  state: DraftState,
  action: PayloadAction<{ datum: DatumParsed<any>; type: string }>
) {
  const { datum, type } = action.payload;
  const theme = state.themeByGeneratorName[datum.generatorName ?? ''];
  if (theme) {
    // get the node style spec where the given type is the only target
    const spec = getNodeStyleSpecUnique(theme, type);

    // if there is one, unset the shape
    if (spec) unset(spec, ['shape']);
  }
}

/**
 * Set the shape for a single type associated with a datum.
 */
function shapeSet(
  state: DraftState,
  action: PayloadAction<{
    datum: DatumParsed<any>;
    type: string;
    shape: ShapeDef;
  }>
) {
  const { datum, type, shape } = action.payload;
  const theme = state.themeByGeneratorName[datum.generatorName ?? ''];
  if (theme) {
    // get the node style spec where the given type is the only target
    const spec = getNodeStyleSpecUnique(theme, type);

    if (spec) {
      // if there is one, set the new value
      set(spec, ['shape'], shape);
    } else {
      // if there isn't one, create a new one and add it to the array of node
      // style specs (creating the array if that doesn't exist);
      const newSpec: NodeStyleSpec = {
        targets: [{ type }],
        shape
      };

      if (!theme.nodes) theme.nodes = [];
      theme.nodes.push(castDraft(newSpec));
    }
  }
}

/**
 * Unset the value of a specific shape style for a single type associated with a datum.
 */
function shapeStyleRemoved(
  state: DraftState,
  action: PayloadAction<{
    datum: DatumParsed<any>;
    type: string;
    style: string;
  }>
) {
  const { datum, type, style } = action.payload;
  const theme = state.themeByGeneratorName[datum.generatorName ?? ''];
  if (theme) {
    // get the node style spec where the given type is the only target
    const spec = getNodeStyleSpecUnique(theme, type);

    // if there is one, unset the given style
    if (spec) unset(spec, ['styles', 'node', style]);
  }
}

/**
 * Set the value of a specific shape style for a single type associated with a datum.
 */
function shapeStyleSet(
  state: DraftState,
  action: PayloadAction<{
    datum: DatumParsed<any>;
    type: string;
    style: string;
    value: any;
  }>
) {
  const { datum, type, style, value } = action.payload;
  const theme = state.themeByGeneratorName[datum.generatorName ?? ''];
  if (theme) {
    // get the node style spec where the given type is the only target
    const spec = getNodeStyleSpecUnique(theme, type);

    if (spec) {
      // if there is one, set the new value
      set(spec, ['styles', 'node', style], value);
    } else {
      // if there isn't one, create a new one and add it to the array of node
      // style specs (creating the array if that doesn't exist)
      const newSpec: NodeStyleSpec = {
        targets: [{ type }],
        styles: {
          node: {
            [style]: value
          }
        }
      };

      if (!theme.nodes) theme.nodes = [];
      theme.nodes.push(castDraft(newSpec));
    }
  }
}

function themeFileLoaded(
  state: DraftState,
  action: PayloadAction<{ datum: DatumParsed<any>; data: string }>
) {
  const { datum, data } = action.payload;
  state.themeByGeneratorName[datum.generatorName ?? ''] = JSON.parse(data);
    // Generate new layout
  validateLayouts(state, datum);
}

/**
 * Set the time index for a datum.
 */
function timeIndexSet(
  state: DraftState,
  action: PayloadAction<{ datum: DatumParsed<any>; index: number }>
) {
  const { datum, index } = action.payload;
  state.timeByDatumId[datum.id] = index;
}

/**
 * Set the CnD spec for a generator (by generator name, so it persists across instances).
 * Also parses projections and sequence policy from the CND spec.
 */
function cndSpecSet(
  state: DraftState,
  action: PayloadAction<{ datum: DatumParsed<any>; spec: string }>
) {
  const { datum, spec } = action.payload;
  const generator = datum.generatorName ?? '';
  state.cndSpecByGeneratorName[generator] = spec;

  // Parse projection config and sequence policy from the CND spec
  try {
    const parsed = parseCndFile(spec);
    state.projectionConfigByGeneratorName[generator] = parsed.projections;
    state.sequencePolicyByGeneratorName[generator] = parsed.sequence.policy;
  } catch (err) {
    // On parse failure, clear derived config but keep the raw spec
    // (the layout parser will show its own error)
    console.warn('[cndSpecSet] Failed to pre-parse CND spec:', err);
    state.projectionConfigByGeneratorName[generator] = [];
    state.sequencePolicyByGeneratorName[generator] = 'ignore_history';
  }
}

/**
 * Set the temporal (sequence) policy for a datum without re-parsing the full
 * CND spec. Used by the temporal-policy dropdown in the Time drawer.
 */
function temporalPolicySet(
  state: DraftState,
  action: PayloadAction<{ datum: DatumParsed<any>; policy: string }>
) {
  const { datum, policy } = action.payload;
  const generator = datum.generatorName ?? '';
  const validPolicies = ['ignore_history', 'stability', 'change_emphasis', 'random_positioning'];
  state.sequencePolicyByGeneratorName[generator] = validPolicies.includes(policy)
    ? (policy as any)
    : 'ignore_history';
}

function getEdgeStyleSpecUnique(
  theme: WritableDraft<SterlingTheme>,
  relation: string
): WritableDraft<EdgeStyleSpec> | undefined {
  return theme.edges?.find((spec) => {
    const targets = spec.targets;
    const target = targets ? targets[0] : undefined;
    return (
      targets !== undefined &&
      targets.length === 1 &&
      target !== undefined &&
      target !== '*' &&
      target.relation === relation
    );
  });
}

/**
 * Get the first occurance of a node style spec in which the only target is the
 * give type.
 */
function getNodeStyleSpecUnique(
  theme: WritableDraft<SterlingTheme>,
  type: string
): WritableDraft<NodeStyleSpec> | undefined {
  return theme.nodes?.find((spec) => {
    const targets = spec.targets;
    const target = targets ? targets[0] : undefined;
    return (
      targets !== undefined &&
      targets.length === 1 &&
      target !== undefined &&
      target !== '*' &&
      target.type === type
    );
  });
}

/**
 * Validate layouts by making sure that one exists for the current set of
 * projections for the given datum. This function will also generate a new 
 * layout when called; this supports on-demand layout changes when certain 
 * theme elements are changed. 
 */
function validateLayouts(state: DraftState, datum: DatumParsed<any>) {
  if (isDatumAlloy(datum)) {
    const theme = state.themeByGeneratorName[datum.generatorName ?? ''];
    const projections = theme ? theme.projections || [] : [];

    // make sure each projection has a node assigned if possible
    if (projections) {
      const instance = datum.parsed.instances[0];
      projections.forEach((projection) => {
        if (!projection.atom) {
          const type = projection.type;
          const atoms = getTypeAtoms(getInstanceType(instance, type));
          if (atoms.length) {
            projection.atom = atoms[0].id;
          }
        }
      });
    }

    const layoutId = generateLayoutId(projections);

    // TN removed to allow on-demand layout changes; this function now always generates 
    // a new layout.
    //if (!state.layoutsByDatumId[datum.id].layoutById[layoutId]) {
      const instances = datum.parsed.instances;
      const atoms = projections.map((proj) => proj.atom).filter(isDefined);
      const projected = instances.map((inst) => applyProjections(inst, atoms));
      const graphs = projected.map((inst) => generateGraph(inst, theme));

      state.layoutsByDatumId[datum.id].layoutById[layoutId] = generateLayout(
        graphs,
        DEFAULT_LAYOUT_SETTINGS
      );
    //}
  }
}

export default {
  asAttributeSet,
  cndSpecSet,
  curveRemoved,
  curveSet,
  edgeLabelStyleRemoved,
  edgeLabelStyleSet,
  edgeStyleRemoved,
  edgeStyleSet,
  edgeIndexSet,
  edgeIndexRemoved,
  graphSpread,
  graphZoomed,
  hiddenRelationAdded,
  nodeLabelPropRemoved,
  nodeLabelPropSet,
  nodeLabelStyleRemoved,
  nodeLabelStyleSet,
  nodesOffset,
  projectionAdded,
  projectionAtomToggled,
  projectionOrderingSet,
  projectionRemoved,
  projectionSet,
  saveThemeRequested,
  selectedProjectionsSet,
  selectedTimeIndicesSet,
  shapeRemoved,
  shapeSet,
  shapeStyleRemoved,
  shapeStyleSet,
  temporalPolicySet,
  themeFileLoaded,
  timeIndexSet,
  timeIndexToggled
};

export { validateLayouts };
