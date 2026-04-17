import { CurveDef } from '@/graph-svg';
import { Vector2 } from '@/vector2';
import {
  curveBasis,
  curveBundle,
  curveCardinal,
  curveCatmullRom,
  curveLinear,
  curveMonotoneX,
  curveMonotoneY,
  curveNatural,
  curveStep,
  curveStepAfter,
  curveStepBefore,
  line,
  Line
} from 'd3-shape';

export function pathGenerator(curve?: CurveDef): Line<Vector2> {
  const generator = line<Vector2>()
    .x((d) => d.x)
    .y((d) => d.y);

  switch (curve?.type) {
    case 'bspline':
      generator.curve(curveBasis);
      break;
    case 'bundle':
      generator.curve(curveBundle.beta(0.85));
      break;
    case 'cardinal':
      generator.curve(curveCardinal.tension(0));
      break;
    case 'catmullrom':
      generator.curve(curveCatmullRom.alpha(0.5));
      break;
    case 'line':
      generator.curve(curveLinear);
      break;
    case 'monotonex':
      generator.curve(curveMonotoneX);
      break;
    case 'monotoney':
      generator.curve(curveMonotoneY);
      break;
    case 'natural':
      generator.curve(curveNatural);
      break;
    case 'step':
      generator.curve(curveStep);
      break;
    case 'stepafter':
      generator.curve(curveStepAfter);
      break;
    case 'stepbefore':
      generator.curve(curveStepBefore);
      break;
    default:
      generator.curve(curveLinear);
  }

  return generator;
}
