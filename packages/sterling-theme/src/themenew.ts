import { CurveDef, ShapeDef } from '@/graph-svg';
import { CSSProperties, SVGProps } from 'react';

export interface SterlingTheme {
  // array of projections
  projections?: Projection[];
  // node styling
  nodes?: NodeStyleSpec[];
  // edge styling
  edges?: EdgeStyleSpec[];
  // properties controlling visibility of disconnected nodes
  hidden?: {
    // whether to hide all disconnected nodes (hiding does effect layout)
    disconnected?: boolean;
    // whether to hide only disconnected builtin nodes (hiding does effect layout)
    builtinDisconnected?: boolean;
  };
}

export interface NodeStyleSpec {
  // the array of types to apply this styling to
  targets?: ThemeTypeTarget[];
  // whether to prevent rendering the targets
  hidden?: boolean;
  // the shape of the node
  shape?: ShapeDef;
  // props
  props?: {
    // svg props applied to the label elements
    label?: SVGProps<SVGTextElement>;
  };
  // styles
  styles?: {
    // css properties applied to the shape element
    node?: CSSProperties;
    // css properties applied to the label elements
    label?: CSSProperties;
  };
}

export interface EdgeStyleSpec {
  // the array of relations to apply this styling to
  targets?: ThemeRelationTarget[];
  // whether to prevent rendering the targets
  hidden?: boolean;
  // whether to display the targets as an attribute rather than an edge
  asAttribute?: boolean;
  // if high-arity relation, what is the tuple index for the source node?
  sourceIndex?: number;
  // if high-arity relation, what is the tuple index for the target node?
  targetIndex?: number;
  // the shape of the curve
  curve?: CurveDef;
  // props
  props?: {
    // svg props applied to the label elements
    label?: SVGProps<SVGTextElement>;
  };
  // styles
  styles?: {
    // css properties applied to the path element
    edge?: CSSProperties;
    // css properties applied to the label elements
    label?: CSSProperties;
  };
}

export interface Projection {
  // the type over which to project
  type: string;
  // the specific atom to project over
  atom?: string;
  // a boolean indicating whether this type represents the individual states of a trace
  time?: boolean;
  // a relation that defines the total ordering if this is a time projection
  timeOrdering?: string;
  // theming to be applied only in the context of this projection
  theme?: Omit<SterlingTheme, 'projections'>;
}

export type ThemeTypeTarget =
  | {
      type: string;
    }
  | '*';

export type ThemeRelationTarget =
  | {
      relation: string;
    }
  | '*';
