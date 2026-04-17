import { Shape, ShapeProps } from './Shape';
import * as d3 from 'd3';
import { BoundingBox, Coords, toFunc } from './Utility';

export interface RectangleProps extends ShapeProps {
  height: number | (() => number);
  width: number | (() => number);
  // Deprecated
  coords?: Coords | (() => Coords);
  labelLocation?: string;
}

export class Rectangle extends Shape {
  height: () => number;
  width: () => number;
  labelLocation: string;

  /**
   * Creates a logical rectangle object
   * @param height height (y direction)
   * @param width width (x direction)
   * @param center coordinates of the center of the shape
   * @param color color for interior
   * @param borderWidth width of border
   * @param borderColor color of border
   * @param label text for label
   * @param labelColor color for label text
   * @param labelSize size of label text
   */
  constructor(props: RectangleProps) {
    super(props);
    this.height = toFunc(0, props.height);
    this.width = toFunc(0, props.width);
    this.labelLocation = props.labelLocation ?? 'center';
    const defaultCoord = {x:0, y:0}
    if(props.center && props.coords)
    {
      throw("you cannot include both coords and a center as the two define the same thing");
    }
    this.center = (() => {
      if(props.center)
      {
        return toFunc(defaultCoord, props.center)
      } 
      else
      {
        const coordsFunc = toFunc(defaultCoord, props.coords);        
        return () => {
          const cs = coordsFunc()
          return {
            x: cs.x + this.width() / 2,
            y: cs.y + this.height() / 2
        }};
      }
    })()
    this.setLabelLocation();
  }

  boundingBox(): BoundingBox {
    return {
      top_left: {
        x: this.center().x - this.width() / 2,
        y: this.center().y - this.height() / 2
      },
      bottom_right: {
        x: this.center().x + this.width() / 2,
        y: this.center().y + this.height() / 2
      }
    };
  }

  setLabelLocation() {
    switch (this.labelLocation) {
      case 'topLeft':
        this.label.setCenter(() => {
          return {
            x:
              this.center().x -
              this.width() / 2 +
              this.label.text().length * 2.5,
            y: this.center().y - this.height() / 2 - this.label.fontSize() * 1
          };
        });
        break;
      case 'topRight':
        this.label.setCenter(() => {
          return {
            x:
              this.center().x +
              this.width() / 2 -
              this.label.text().length * 2.5,
            y: this.center().y - this.height() / 2 - this.label.fontSize() * 1
          };
        });
        break;
      case 'bottomRight':
        this.label.setCenter(() => {
          return {
            x:
              this.center().x +
              this.width() / 2 -
              this.label.text().length * 2.5,
            y: this.center().y + this.height() / 2 + this.label.fontSize() * 1
          };
        });
        break;
      case 'bottomLeft':
        this.label.setCenter(() => {
          return {
            x:
              this.center().x -
              this.width() / 2 +
              this.label.text().length * 2.5,
            y: this.center().y + this.height() / 2 + this.label.fontSize() * 1
          };
        });
        break;
    }
  }

  setWidth(width: number | (() => number)) {
    this.width = toFunc(this.width(), width);
  }
  setHeight(height: number | (() => number)) {
    this.height = toFunc(this.height(), height);
  }

  render(svg: any, parent_masks?: BoundingBox[]) {
    let maskIdentifier: string = '';

    let render_masks: BoundingBox[];
    if (parent_masks) {
      render_masks = this.masks.concat(parent_masks);
    } else {
      render_masks = this.masks;
    }
    maskIdentifier = this.addMaskRender(render_masks, svg);

    d3.select(svg)
      .append('rect')
      .attr('x', this.center().x - this.width() / 2)
      .attr('y', this.center().y - this.height() / 2)
      .attr('width', this.width())
      .attr('height', this.height())
      .attr('stroke-width', this.borderWidth())
      .attr('stroke', this.borderColor())
      .attr('fill', this.color())
      .attr('mask', (render_masks.length > 0) ? `url(#${maskIdentifier})` : '')
      .attr('opacity', this.opacity());
    super.render(svg, render_masks);
  }
}
