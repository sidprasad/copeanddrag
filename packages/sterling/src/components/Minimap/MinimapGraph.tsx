import { GraphGroup, InteractionProvider } from '@/graph-svg';
import { useRef } from 'react';
import { MinimapProps } from './Minimap';
import {
  edgeCurves,
  edgeStyles,
  generateMinimapGraph,
  graphHeight,
  graphWidth,
  nodeLabels,
  nodeShapes,
  nodeStyles
} from './graph';

const MinimapGraph = (props: MinimapProps) => {
  const width = graphWidth(props);
  const height = graphHeight(props);
  const graph = generateMinimapGraph(props);
  const viewBox = `${-width / 2} ${-height / 2} ${width} ${height}`;
  const ref = useRef<SVGSVGElement>(null);
  return (
    <div className='grid place-items-center overflow-y-auto'>
      <InteractionProvider
        svg={ref.current}
        onClickNode={(nodeId) => {
          const handler = props.onNodeClick ?? props.onChange;
          if (handler) handler(+nodeId);
        }}
      >
        <svg
          ref={ref}
          style={{ minWidth: width }}
          width={width}
          height={height}
          viewBox={viewBox}
        >
          <GraphGroup
            id='minimap'
            graph={graph}
            nodeShapes={nodeShapes(graph)}
            nodeStyles={nodeStyles(graph, props.current, props.selectedIndices)}
            nodeLabels={nodeLabels(graph, props.current, props.selectedIndices)}
            edgeCurves={edgeCurves(graph)}
            edgeStyles={edgeStyles(graph)}
          />
        </svg>
      </InteractionProvider>
    </div>
  );
};

export { MinimapGraph };
