import {Shape, ShapeProps} from './Shape'
import * as d3 from 'd3' 
import { averagePath, boundsOfList, shiftList, BoundingBox, Coords, toFunc } from './Utility';

export interface PolygonProps extends ShapeProps {
    points: Coords[] | (() => Coords)[]
}

/**
 * Class Representing Polygonal objects. Takes the form of any
 * series of points, and will form a polygon with said points as the boundary.
 */
export class Polygon extends Shape{
    pointsRelative: (() => Coords)[]

    /**
     * Constructs a polygon object
     * @param points list of points forming outside
     * @param color color of interior
     * @param borderWidth width of the border
     * @param borderColor color of the border
     * @param label text to label with
     * @param labelColor color of label text
     * @param labelSize size of the label
     */
    constructor(props: PolygonProps){
        let pointsUnshifted: (() => Coords)[] = props.points.map(
            (point): (() => Coords) => toFunc({x: 0, y: 0}, point))
        
        props.center = (): Coords => {
            return averagePath(pointsUnshifted.map((coordFunc) => coordFunc()))
            }, 
        
        super(props)
        this.pointsRelative = shiftList(pointsUnshifted, this.center)
    }

    boundingBox(): BoundingBox {
        return boundsOfList(this.pointsRelative.map((pointFn) => {return {
        x: pointFn().x + this.center().x,
        y: pointFn().y + this.center().y
        }}));
    }

    render(svg: any, parent_masks: BoundingBox[]){
        let maskIdentifier: string = '';
        let render_masks: BoundingBox[];
        if (parent_masks) {
          render_masks = this.masks.concat(parent_masks);
        } else {
          render_masks = this.masks;
        }
        let truePoints: Coords[] = this.pointsRelative.map((pointFn): Coords => {return {
            x: pointFn().x + this.center().x,
            y: pointFn().y + this.center().y
          }}
          )
          let path = d3.path();
          path.moveTo(truePoints[0].x, truePoints[0].y);
          truePoints.forEach((point: Coords) => {
            path.lineTo(point.x, point.y);
          });
        path.closePath()
        maskIdentifier = this.addMaskRender(render_masks, svg);
        d3.select(svg)
            .append('path')
            .attr('d', path.toString())
            .attr('stroke-width', this.borderWidth)
            .attr('stroke', this.borderColor)
            .attr('fill', this.color)
            .attr('mask', (render_masks.length > 0) ? `url(#${maskIdentifier})` : '')
            .attr('opacity', this.opacity()) 
        super.render(svg, render_masks)
    }
}