import * as d3 from 'd3';
//import {} from './Constants';
import { VisualObject } from './VisualObject';
import { BoundingBox, Coords, toFunc } from './Utility';

export interface ImageBoxProps {
  coords?: Coords | (() => Coords);
  url?: string | (() => string);
  width: number | (() => number);
  height: number | (() => number);
}

export class ImageBox extends VisualObject {
  url: () => string;
  width: () => number;
  height: () => number;

  /**
   * Fetches an image from a URL and displays it within a box
   */
  constructor(props: ImageBoxProps) {
    super(props.coords);
    this.url = toFunc('', props.url);
    this.width = toFunc(100, props.width);
    this.height = toFunc(100, props.height);
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

  override render(svg: any, parent_masks: BoundingBox[]) {

    let maskIdentifier: string = '';

    let render_masks: BoundingBox[];
    if (parent_masks) {
      render_masks = this.masks.concat(parent_masks);
    } else {
      render_masks = this.masks;
    }
    maskIdentifier = this.addMaskRender(render_masks, svg);

    d3.select(svg)
        .append("svg:image")
        .attr('x', this.center().x - this.width() / 2)
        .attr('y', this.center().y - this.height() / 2)
        .attr('width', this.width())
        .attr('height', this.height())
        .attr('mask', (render_masks.length > 0) ? `url(#${maskIdentifier})` : '')
        .attr("xlink:href", `${this.url()}`)
    super.render(svg);
  }
}
