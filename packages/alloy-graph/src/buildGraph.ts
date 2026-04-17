import {
  AlloyAtom,
  AlloyInstance,
  applyProjections,
  atomIsOfType,
  getAtomType,
  getInstanceAtom,
  getInstanceAtoms,
  getInstanceRelations,
  getInstanceType,
  getRelationTuples,
  getTypeAtoms,
  isBuiltin
} from '@/alloy-instance';
import {
  getHiddenTypes,
  getProjectedTypes,
  SterlingThemeOld
} from '@/sterling-theme';
import { newGraph, Node } from '@/graph-lib';
import {
  getVisibleGraphComponents,
  GraphComponents
} from './getVisibleGraphComponents';
import { layoutNodes } from './layoutNodes';
import { projectInstance } from './projectInstances';
import { AlloyEdge, AlloyGraph, AlloyNode } from './types';
import dagre from 'dagre';

// export function buildGraph(
//   instance: AlloyInstance,
//   theme?: SterlingThemeOld
// ): AlloyGraph {
//   // Apply projections
//   instance = projectInstance(instance, theme);

//   // Get the graph components and position the nodes
//   const graphComponents = getVisibleGraphComponents(instance, theme);

//   // TN: danger! We have types from srcnew and src interacting! 
//   //   This doesn't present a problem in execution, but it does prevent Jest/VSCode...
//   const nodes: AlloyNode[] = layoutNodes(graphComponents);
//   const edges: AlloyEdge[] = graphComponents.edges;

//   return newGraph(nodes, edges);

//   // src:
//   // export type AlloyNode = PositionedNode & { atom: AlloyAtom };
//   // export type AlloyEdge = RoutedEdge & { relation: string; tuple: AlloyTuple };
//   // srcnew:
//   // export type AlloyNode = Node & { atom: AlloyAtom };
//   // export type AlloyEdge = Edge & { relation: AlloyRelation; tuple: AlloyTuple };
// }
