import { Rectangle } from './Rectangle';
import { Circle } from './Circle';
import { Shape } from './Shape';
import { Stage } from './Stage';
import { TextBox } from './Textbox';
import { VisualObject } from './VisualObject';
import { Line } from './Line';
import { Grid } from './Grid';
import { Polygon } from './Polygon';
import { Tree, VisTree } from './Tree';
import { Edge } from './Edge';
import { boxUnion } from './Utility';
import { Hull } from './Hull';
import { ConjoinedObject } from './ConjoinedObject'
import { Ellipse } from './Ellipse';
import { ImageBox } from './ImageBox';
import { AlloySet } from '../sterling/src/components/ScriptView/alloy-proxy/AlloySet';
import { AlloyAtom } from '../sterling/src/components/ScriptView/alloy-proxy/AlloyAtom';

interface scriptViewImport {
  name: string;
  value: any;
}

export const d3LibDefs: string = `
`;

/**
 * The order here will be \textbf{very} important. Make sure files come after
 * the files they import.
 */
const scriptViewImports: scriptViewImport[] = [
  { name: 'VisualObject', value: VisualObject },
  { name: 'Shape', value: Shape },
  { name: 'Grid', value: Grid },
  { name: 'Rectangle', value: Rectangle },
  { name: 'Circle', value: Circle },
  { name: 'Stage', value: Stage },
  { name: 'TextBox', value: TextBox },
  { name: 'Line', value: Line },
  { name: 'Polygon', value: Polygon },
  { name: 'Tree', value: Tree },
  { name: 'Edge', value: Edge },
  { name: 'Hull', value: Hull },
  { name: 'ConjoinedObject', value: ConjoinedObject },
  { name: 'boxUnion', value: boxUnion },
  { name: 'Ellipse', value: Ellipse},
  { name: 'ImageBox', value: ImageBox},
  // For debugging and workaround purposes, expose some constructors 
  { name: 'AlloySet', value: AlloySet},
  { name: 'AlloyAtom', value: AlloyAtom}
];

export { scriptViewImports };
