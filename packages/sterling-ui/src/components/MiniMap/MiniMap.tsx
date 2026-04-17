// import { GraphSVGDiv } from '@graph-ts/graph-svg';
import { GraphGroup, GraphSVGDiv } from '@/graph-svg';
import { useMemo } from 'react';
import { buildEdgeCurves } from './buildEdgeCurves';
import { buildEdgeStyles } from './buildEdgeStyles';
import { buildGraph } from './buildGraph';
import { buildNodeLabels } from './buildNodeLabels';
import { buildNodeShapes } from './buildNodeShapes';
import { buildNodeStyles } from './buildNodeStyles';

export interface MiniMapProps {
  numStates: number;
  loopBack: number;
  selectedIndices: number[];
  onSelectedIndicesDidChange?: (indices: number[]) => void;
}

const MiniMap = (props: MiniMapProps) => {
  const { numStates, loopBack, selectedIndices, onSelectedIndicesDidChange } =
    props;

  const graph = buildGraph(numStates, loopBack);
  const nodeShapes = buildNodeShapes(graph);
  const nodeStyles = buildNodeStyles(graph);
  const nodeLabels = buildNodeLabels(graph, selectedIndices);
  const edgeCurves = buildEdgeCurves(graph);
  const edgeStyles = buildEdgeStyles(graph);

  return (
    <GraphSVGDiv style={{ height: '100%' }}>
      <GraphGroup
        graph={graph}
        id='minimap'
        nodeShapes={nodeShapes}
        nodeStyles={nodeStyles}
        nodeLabels={nodeLabels}
        edgeCurves={edgeCurves}
        edgeStyles={edgeStyles}
      />
    </GraphSVGDiv>
  );
};

export { MiniMap };
