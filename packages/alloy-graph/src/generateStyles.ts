import { defaultTheme, SterlingThemeOld, StyleSet } from '@/sterling-theme';
import { getEdges, getNodes } from '@/graph-lib';
import {
  Dict,
  GraphSVGDivProps,
  LabelDef,
  ShapeDef
} from '@graph-ts/graph-svg';
import { EdgeLabelDef } from '@graph-ts/graph-svg/dist/dts/components/types';
import { CSSProperties, SVGProps } from 'react';
import { AlloyGraph } from './types';

export function generateStyles(
  graph: AlloyGraph,
  theme?: SterlingThemeOld
): StyleSet {
  const nodeLabels: Dict<LabelDef[]> = {};
  const nodeStyles: Dict<CSSProperties> = {};
  const nodeShapes: Dict<ShapeDef> = {};
  const edgeLabels: Dict<EdgeLabelDef[]> = {};
  const edgeStyles: Dict<CSSProperties> = {};

  const defTheme = defaultTheme();
  const nodeThemes = [...(defTheme.nodes || [])];
  const edgeThemes = [...(defTheme.edges || [])];
  if (theme && theme.nodes) nodeThemes.push(...theme.nodes);
  if (theme && theme.edges) edgeThemes.push(...theme.edges);

  // generate node styles
  getNodes(graph).forEach((node) => {
    const type = node.atom.type;
    const nodeStyle: CSSProperties = {};
    const labelStyle: CSSProperties = {};
    const labelProps: SVGProps<SVGTextElement> = {};
    let nodeShape: ShapeDef | undefined;
    nodeThemes.forEach((nodeTheme) => {
      if (
        nodeTheme.targets?.some(
          (target) => target === '*' || target.type === type
        )
      ) {
        Object.assign(nodeStyle, nodeTheme.styles?.node);
        Object.assign(labelStyle, nodeTheme.styles?.label);
        Object.assign(labelProps, nodeTheme.props?.label);
        nodeShape = nodeTheme.shape;
      }
    });
    nodeStyles[node.id] = nodeStyle;
    nodeLabels[node.id] = [
      {
        text: node.atom.id,
        style: labelStyle,
        props: labelProps
      }
    ];
    if (nodeShape) {
      nodeShapes[node.id] = nodeShape;
    }
  });

  // generate edge styles
  getEdges(graph).forEach((edge) => {
    const relation = edge.relation;
    const edgeStyle: CSSProperties = {};
    const labelStyle: CSSProperties = {};
    edgeThemes.forEach((edgeTheme) => {
      if (
        edgeTheme.targets?.some(
          (target) => target === '*' || target.relation === relation
        )
      ) {
        Object.assign(edgeStyle, edgeTheme.styles?.edge);
        Object.assign(labelStyle, edgeTheme.styles?.label);
      }
    });
    edgeStyles[edge.id] = edgeStyle;
    edgeLabels[edge.id] = [
      {
        text: edge.relation,
        style: {
          ...labelStyle,
          fill: 'white',
          stroke: 'white',
          strokeOpacity: 0.75,
          strokeWidth: 5
        }
      },
      {
        text: edge.relation,
        style: labelStyle
      }
    ];
  });

  return {
    edgeLabels,
    edgeStyles,
    nodeLabels,
    nodeStyles,
    nodeShapes
  };
}
