import { v4 as uuidv4 } from 'uuid';
import * as d3 from 'd3';
import { VisualObject } from './VisualObject';
import {
  BoundingBox,
  Coords,
  toFunc,
  averagePath,
  shiftList,
  boundsOfList
} from './Utility';
import {
  DEFAULT_COLOR,
  DEFAULT_LINE_COLOR,
  DEFAULT_STROKE_WIDTH
} from './Constants';

/**
 * Use SVG arc (command "A") to curve the line. 
 * Will ignore all points after the first two.
 */
export interface ArcSpec {
  curveType: 'arc', 
  xradius: number,
  yradius: number,
  sweep ?: number,
}
/**
 * No curve will be applied.
 */
export interface NoCurveSpec {
  curveType: 'none'
}
/**
 * Currently unsupported
 */
export interface CubicBezierSpec {
  curveType: 'cubic'
}
/**
 * Currently unsupported
 */
export interface QuadraticBezierSpec {
  curveType: 'quadratic'
}
export type CurveSpec = CubicBezierSpec | QuadraticBezierSpec | ArcSpec | NoCurveSpec;

export interface LineProps {
  points?: Coords[] | (() => Coords)[];
  arrow?: boolean;
  color?: string | (() => string);
  width?: number | (() => number);
  opacity?: number | (() => number);
  style?: string | (() => string);
  curve?: CurveSpec | (() => CurveSpec);
}

export class Line extends VisualObject {
  pointsRelative: (() => Coords)[];
  color: () => string;
  width: () => number;
  opacity: () => number;
  arrow: boolean;
  style: () => string;
  curve: () => CurveSpec;

  /**
   * Creates a line on the given poitns.
   * @param points list of points for the line to pass through
   * @param color color of line
   * @param width width of line
   * @param opacity of the line
   */
  constructor(props: LineProps) {
    let pointsUnshifted: (() => Coords)[];
    if (props.points != undefined) {
      pointsUnshifted = props.points.map((point): (() => Coords) =>
        toFunc({ x: 0, y: 0 }, point)
      );
    } else {
      pointsUnshifted = [];
    }

    super((): Coords => {
      return averagePath(pointsUnshifted.map((coordFunc) => coordFunc()));
    });

    this.pointsRelative = shiftList(pointsUnshifted, this.center);
    this.color = toFunc(DEFAULT_LINE_COLOR, props.color);
    this.width = toFunc(DEFAULT_STROKE_WIDTH, props.width);
    this.opacity = toFunc(1, props.opacity);
    this.arrow = props.arrow ?? false;
    this.style = toFunc('full', props.style);
    this.curve = toFunc({curveType: 'none'}, props.curve)
  }

  boundingBox(): BoundingBox {
    return boundsOfList(
      this.pointsRelative.map((pointFn) => {
        return {
          x: pointFn().x + this.center().x,
          y: pointFn().y + this.center().y
        };
      })
    );
  }

  setColor(color: string | (() => string)) {
    this.color = toFunc(this.color(), color);
  }
  setWidth(width: number | (() => number)) {
    this.width = toFunc(this.width(), width);
  }
  setOpacity(opacity: number | (() => number)) {
    this.opacity = toFunc(this.opacity(), opacity);
  }

  override render(svg: any, parent_masks?: BoundingBox[]) {
    let maskIdentifier: string = '';

    let render_masks: BoundingBox[];
    if (parent_masks) {
      render_masks = this.masks.concat(parent_masks);
    } else {
      render_masks = this.masks;
    }
    maskIdentifier = this.addMaskRender(render_masks, svg);

    //pretty clever code (or stupid, depending on who you ask)
    if (this.pointsRelative.length == 2) {
      while(this.pointsRelative[0]().x == this.pointsRelative[1]().x || this.pointsRelative[0]().y == this.pointsRelative[1]().y){
        if (this.pointsRelative[0]().x == this.pointsRelative[1]().x) {
          const currlam = this.pointsRelative[0];
          this.pointsRelative[0] = () => {
            return { x: currlam().x + 0.0001, y: currlam().y };
          };
        }
        if (this.pointsRelative[0]().y == this.pointsRelative[1]().y) {
          const currlam = this.pointsRelative[0];
          this.pointsRelative[0] = () => {
            return { x: currlam().x, y: currlam().y + 0.0001 };
          };
        }
      }
    }

    let truePoints: Coords[] = this.pointsRelative.map((pointFn): Coords => {
      return {
        x: pointFn().x + this.center().x,
        y: pointFn().y + this.center().y
      };
    });
    
    const pathstr = this.buildPathString(truePoints) 
    
    let style: string | number = '0';
    if (this.style() == 'dashed') style = this.width() * 5;
    else if (this.style() == 'dotted') style = this.width();

    // TypeScript will now enforce that we're passing the proper type to attr.
    // attr doesn't take Paths, but string will work.
    if (this.arrow) {
      // add in definition for arrow. use a fresh uuid to distinguish arrows for each line
      //   (otherwise difference between lines, like color changes, won't be seen)
      // credit to : http://jsfiddle.net/igbatov/v0ekdzw1/ 
      //   for the arrows (thanks Igor Batov <3)
      const fresh_uuid: string = uuidv4()
      d3.select(svg)
        .append('svg:defs')
        .append('svg:marker')
        .attr('id', fresh_uuid)
        .attr('refX', 11)
        .attr('refY', 6)
        .attr('markerWidth', 10 * this.width())
        .attr('markerHeight', 10 * this.width())
        .attr('markerUnits', 'userSpaceOnUse')
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M 0 0 12 6 0 12 3 6')      
        .style('fill', this.color);    

      // Add the line itself, which refers to the arrow
      d3.select(svg)
        .append('path')        
        .attr('d', pathstr) 
        .attr('stroke-width', this.width)
        .attr('stroke', this.color)
        .attr('opacity', this.opacity())
        .attr('marker-end', `url(#${fresh_uuid})`)
        // Only add the mask ID if it exists
        .attr('mask', (render_masks.length > 0) ? `url(#${maskIdentifier})` : '')
        .style('stroke-dasharray', style)
        .attr('fill', 'transparent'); // Should prob make easier in future.
      super.render(svg, render_masks);
    } else {
      // otherwise, no arrow, just a line
      d3.select(svg)
        .append('path')        
        .attr('d', pathstr) 
        .attr('stroke-width', this.width)
        .attr('stroke', this.color)
        .attr('opacity', this.opacity())
        .attr('fill', 'transparent')
        .attr('mask', (render_masks.length > 0) ? `url(#${maskIdentifier})` : '')
        .style('stroke-dasharray', style); // Should prob make easier in future.
      super.render(svg, render_masks);
    }
  }

  private buildPathString(truePoints: Coords[]): string {
    const curveSpec = this.curve()
    switch(curveSpec.curveType) {
      case 'none': 
        const path = d3.path();    
        path.moveTo(truePoints[0].x, truePoints[0].y);    
        truePoints.forEach((point: Coords) => {
           path.lineTo(point.x, point.y);
        });
        return path.toString();
      case 'arc':
        // D3 is not currently building the arc as expected, so build the 
        // SVG path string directly. Ignore all but the first two points. 
        // Default sweep to `1` (curve upward on a left-to-right line)
        // TODO: first 0 is the angle relative to the x axis
        // TODO: second 0 should be 1 if the arc sweeps > 180 degrees
        return `M ${truePoints[0].x} ${truePoints[0].y} 
                A ${curveSpec.xradius} ${curveSpec.yradius} ${0} ${0} 
                  ${curveSpec.sweep !== undefined ? curveSpec.sweep : 1} ${truePoints[1].x} ${truePoints[1].y}`
      case 'cubic': 
        console.log('Error: cubic curves currently unsupported by Line')
        throw new Error('cubic curves currently unsupported by Line')
      case 'quadratic': 
        console.log('Error: quadratic curves currently unsupported by Line')
        throw new Error('quadratic curves currently unsupported by Line')
      default:
        console.log(`Error: unrecognized curveType in prop ${JSON.stringify(curveSpec)} (check you have not misspelled the field name)`)
        throw new Error(`unknown curveType field in Line prop ${JSON.stringify(curveSpec)} (check you have not misspelled the field name)`)
    }
  }
}
