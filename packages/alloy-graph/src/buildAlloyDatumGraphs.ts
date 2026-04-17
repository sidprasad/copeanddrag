import { AlloyEdge, AlloyGraph, AlloyNode } from '@/alloy-graph';
import { AlloyDatum } from '@/alloy-instance';
import { newGraph } from '@/graph-lib';
import { SterlingThemeOld } from '@/sterling-theme';
import _ from 'lodash-es';
import {
  AtomNode,
  getVisibleGraphComponents
} from './getVisibleGraphComponents';
import { layoutGraph } from './layoutGraph';
import { projectInstances } from './projectInstances';

/**
 * Build graphs for each instance in an Alloy trace, ensuring consistent
 * placement for nodes shared among the graphs.
 *
 * @param trace
 * @param theme
 */
export function buildAlloyDatumGraphs(
  trace: AlloyDatum,
  theme?: SterlingThemeOld
): AlloyGraph[] {
  // Apply projections to all instances
  const instances = projectInstances(trace.instances, theme);

  // Get the graph components for each instance
  const graphComponents = instances.map((instance) =>
    getVisibleGraphComponents(instance, theme)
  );

  // Get the graph components for the complete trace
  const traceNodes: AtomNode[] = _.chain(
    graphComponents.map((comp) => comp.nodes)
  )
    .flatten()
    .uniqBy((node: AtomNode) => node.atom.id)
    .value();
  const traceEdges: AlloyEdge[] = _.chain(
    graphComponents.map((comp) => comp.edges)
  )
    .flatten()
    .uniqBy((edge: AlloyEdge) => edge.id)
    .value();

  const { nodes, edgePaths } = layoutGraph({
    nodes: traceNodes,
    edges: traceEdges
  });
  const nodeDict = _.keyBy(nodes, (node: AlloyNode) => node.id);

  return graphComponents.map((components) => {
    const graphNodes = components.nodes.map(
      (atomNode) => nodeDict[atomNode.id]
    );
    const graphEdges = components.edges.map((edge) => {
      return { ...edge, waypoints: edgePaths[edge.id] };
    });
    return newGraph(graphNodes, graphEdges);
  });
}
