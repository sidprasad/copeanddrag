import { Line } from './Line';
import { jarvisAlgo } from './geometricHelpers';
import { BoundingBox, Coords, pointsOnBorder } from './Utility';
import { VisualObject } from './VisualObject';
import * as d3 from 'd3';
import { Circle } from './Circle';
import { Rectangle } from './Rectangle';

export interface HullProps {
  objs: VisualObject[];
  fuzz?: number; //space around each point
  smooth?: boolean; //if the edges of bounding box should be "jagged" or not
}

export class Hull extends VisualObject {
  pts: Coords[];
  fuzz: number;
  smooth: boolean;

  constructor(props: HullProps) {
    super();
    this.fuzz = props.fuzz ?? 0;
    this.smooth = props.smooth ?? false;
    this.pts = jarvisAlgo(this.populatePoints(props.objs));
  }

  populatePoints(objs: VisualObject[]): Coords[] {
    let pts: Coords[] = [];

    if (!(objs instanceof Array)) {
      throw 'objects passed into hull parameter pts must be of type array';
    }
    if (this.fuzz == 0) {
      //simple population of hull points (just object centers)
      objs.forEach((obj) => {
        pts.push({ x: obj.center().x, y: obj.center().y });
      });
    } else if (this.smooth) {
      objs.forEach((obj) => {
        //build a circle around the object (of radius given by fuzz)
        const objFuzz = new Circle({ radius: this.fuzz, center: obj.center() });
        const fuzzPts = pointsOnBorder(objFuzz.getLam(), 100);
        fuzzPts.forEach((p) => pts.push(p));
      });
    } else {
      objs.forEach((obj) => {
        //build a circle around the object (of radius given by fuzz)
        const objFuzz = new Rectangle({ height: this.fuzz, width: this.fuzz });
        objFuzz.setCenter(obj.center());
        const fuzzPts = pointsOnBorder(objFuzz.getLam(), 100);
        fuzzPts.forEach((p) => pts.push(p));
      });
    }

    return pts;
  }

  override render(svg: any, parent_masks?: BoundingBox[]) {
    let render_masks: BoundingBox[];
    if (parent_masks) {
      render_masks = this.masks.concat(parent_masks);
    } else {
      render_masks = this.masks;
    }
    const l = new Line({ points: this.pts });
    l.render(svg, render_masks);
  }
}
