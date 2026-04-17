//import { GraphSVGDivProps, ShapeDef } from '@graph-ts/graph-svg';
import { GraphSVGDivProps, ShapeDef } from '@/graph-svg';
import { CSSProperties, SVGProps } from 'react';

// export type StyleSet = Pick<
//   GraphSVGDivProps,
//   'nodeLabels' | 'nodeStyles' | 'nodeShapes' | 'edgeLabels' | 'edgeStyles'
// >;

export interface SterlingThemeOld {
  sterling: 'v0';
  nodes?: NodeStyleSpec[];
  edges?: EdgeStyleSpec[];
  projections?: ProjectionOld[];
}

interface NodeStyleSpec {
  targets?: ThemeTypeTarget[];
  shape?: ShapeDef;
  styles?: {
    node?: CSSProperties;
    label?: CSSProperties;
  };
  props?: {
    label?: SVGProps<SVGTextElement>;
  };
  visible?: boolean;
}

interface EdgeStyleSpec {
  targets?: ThemeRelationTarget[];
  styles?: {
    edge?: CSSProperties;
    label?: CSSProperties;
  };
  collapse?: boolean;
}

interface ProjectionOld {
  type: string;
}

type ThemeTypeTarget =
  | {
      type: string;
    }
  | '*';

type ThemeRelationTarget =
  | {
      relation: string;
    }
  | '*';
