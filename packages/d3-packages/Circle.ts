import { Shape, ShapeProps } from './Shape';
import * as d3 from 'd3';
import {
  BoundingBox,
  Coords,
  ExperimentalBoundingBox,
  toFunc
} from './Utility';
import { BoundingBoxGenerator } from './VisualObject';

export interface CircleProps extends ShapeProps {
  radius: number | (() => number);
}

export class Circle extends Shape {
  radius: () => number;
  bounding_box_lam: BoundingBoxGenerator;

  /**
   * Creates a circle object at the given location
   * @param radius radius of circle
   * @param coords coordinates of circle's center
   * @param color color of interior
   * @param borderWidth width border
   * @param borderColor color for border
   * @param label text for label
   * @param labelColor color of label
   * @param labelSize size of label
   */
  constructor(props: CircleProps) {
    super(props);
    this.radius = toFunc(0, props.radius);

    this.bounding_box_lam = (radians: number) => {
      const rad = this.radius()
      const ctr = this.center()
      return {
        x: rad * Math.cos(radians) + ctr.x,
        y: rad * Math.sin(radians) + ctr.y
      };
    };
    this.hasBoundingBox = true;
  }

  boundingBox(): BoundingBox {
    return {
      top_left: {
        x: this.center().x - this.radius(),
        y: this.center().y - this.radius()
      },
      bottom_right: {
        x: this.center().x + this.radius(),
        y: this.center().y + this.radius()
      }
    };
  }

  setRadius(radius: number | (() => number)) {
    this.radius = toFunc(0, radius);
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

    d3.select(svg)
      .append('circle')
      .attr('cx', this.center().x)
      .attr('cy', this.center().y)
      .attr('r', this.radius)
      .attr('stroke-width', this.borderWidth)
      .attr('stroke', this.borderColor)
      .attr('fill', this.color)
      .attr('mask', (render_masks.length > 0 ) ? `url(#${maskIdentifier})` : '')
      .attr('opacity', this.opacity());
    super.render(svg, render_masks);
  }
}
