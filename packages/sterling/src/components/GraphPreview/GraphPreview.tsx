import { GraphSVGDiv } from '@/graph-svg';
import { AspectRatio } from '@chakra-ui/react';

const GraphPreview = () => {
  // const graphs = useSterlingSelector((state) =>
  //   selectDatumGraphs(state, 'test')
  // );
  // const nodeShapes = useSterlingSelector((state) =>
  //   selectDatumNodeShapes(state, 'test')
  // ).map((shapeDefs) => {
  //   const scaledShapeDefs: Record<string, ShapeDef> = {};
  //   forEach(shapeDefs, (shape, id) => {
  //     if (shape.shape === 'circle')
  //       scaledShapeDefs[id] = {
  //         shape: 'circle',
  //         radius: shape.radius / 4
  //       };
  //     if (shape.shape === 'rectangle')
  //       scaledShapeDefs[id] = {
  //         shape: 'rectangle',
  //         width: shape.width / 4,
  //         height: shape.height / 4
  //       };
  //   });
  //   return scaledShapeDefs;
  // });
  // const nodeStyles = useSterlingSelector((state) =>
  //   selectDatumNodeStyles(state, 'test')
  // );
  // const edgeCurves = useSterlingSelector((state) =>
  //   selectDatumEdgeCurves(state, 'test')
  // );
  // const edgeStyles = useSterlingSelector((state) =>
  //   selectDatumEdgeStyles(state, 'test')
  // );
  return (
    <AspectRatio ratio={4 / 3}>
      <GraphSVGDiv style={{ width: '100%', height: '100%' }}></GraphSVGDiv>
    </AspectRatio>
  );
};

export { GraphPreview };
