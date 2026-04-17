import { subtract, Vector2 } from '@graph-ts/vector2';
import { applyToPoint, identity, inverse, Matrix, scale, transform, translate } from 'transformation-matrix';

export enum HoverType {
    Node = 'node',
    Edge = 'edge',
    Waypoint = 'waypoint'
}

class Gesture {

    private _dragging: boolean = false;
    private _dragStart: Vector2 = { x: 0, y: 0 };
    private _spreadTransform: Matrix = identity();
    private _spreadTransformInv: Matrix = inverse(this._spreadTransform);
    private _zoomTransform: Matrix = identity();
    private _zoomTransformInv: Matrix = inverse(this._zoomTransform);

    private _hoverTarget: string | null = null;
    private _hoverType: HoverType | null = null;

    private _svg: SVGSVGElement;
    private _scaleFactor: number;
    private _pt: SVGPoint;

    constructor (svg: SVGSVGElement, scaleFactor: number) {
        this._svg = svg;
        this._scaleFactor = scaleFactor;
        this._pt = svg.createSVGPoint();
    }

    dragEnd (event: MouseEvent): Vector2 {

        // Finish dragging
        this._dragging = false;

        // Get transformation matrix to go from event coords to local coords
        const inverseTransform = transform(this._spreadTransformInv, this._zoomTransformInv);

        // Return the total drag offset in local coords
        return subtract(
            applyToPoint(inverseTransform, toVector(event)),
            applyToPoint(inverseTransform, this._dragStart)
        );

    }

    dragOffset (event: MouseEvent): Vector2 {
        return subtract(
            applyToPoint(this._zoomTransformInv, toVector(event)),
            applyToPoint(this._zoomTransformInv, this._dragStart)
        );
    }

    dragStart (event: MouseEvent): void {
        this._dragStart.x = event.clientX;
        this._dragStart.y = event.clientY;
        this._dragging = true;
    }

    getZoom (): Matrix {
        return this._zoomTransform;
    }

    hoverEdge (edgeID: string): void {
        this._hoverTarget = edgeID;
        this._hoverType = HoverType.Edge;
    }

    hoverNode (nodeID: string): void {
        this._hoverTarget = nodeID;
        this._hoverType = HoverType.Node;
    }

    hoverNothing (): void {
        this._hoverTarget = null;
        this._hoverType = null;
    }

    hoverWaypoint (waypointID: string): void {
        this._hoverTarget = waypointID;
        this._hoverType = HoverType.Waypoint;
    }

    hoveredEdgeID (): string | null {
        return this._hoverType === HoverType.Edge
            ? this._hoverTarget
            : null;
    }

    hoveredNodeID (): string | null {
        return this._hoverType === HoverType.Node
            ? this._hoverTarget
            : null;
    }

    hoveredWaypointID (): string | null {
        return this._hoverType === HoverType.Waypoint
            ? this._hoverTarget
            : null;
    }

    isDragging (): boolean {
        return this._dragging;
    }

    setSpread (matrix: Matrix): Matrix {
        this._spreadTransform = matrix;
        this._spreadTransformInv = inverse(matrix);
        return matrix;
    }

    setSVG (svg: SVGSVGElement): void {
        this._svg = svg;
        this._pt = svg.createSVGPoint();
    }

    setZoom (matrix: Matrix): Matrix {
        this._zoomTransform = matrix;
        this._zoomTransformInv = inverse(matrix);
        return matrix;
    }

    setZoomFactor (zoomFactor: number): void {
        this._scaleFactor = zoomFactor;
    }

    translate (event: MouseEvent): Matrix {

        // Get the current and previous points in local coordinates
        const point = this._toLocalCoordinates(event.clientX, event.clientY);
        const offset = this._toLocalCoordinates(event.clientX + event.movementX, event.clientY + event.movementY);

        // Calculate the difference
        const { x, y } = subtract(offset, point);

        // Apply the difference to the transformation matrix
        this._zoomTransform = transform([
            this._zoomTransform,
            translate(x, y)
        ]);

        // Return the new zoom matrix
        return this._zoomTransform;

    }

    /**
     * Use a wheel event to create a new spread matrix. The deltaX value is used to
     * determine the direction and magnitude of the spread, so the shift key must
     * be pressed when scrolling for anything to occur.
     */
    spread (event: WheelEvent): Matrix {

        // Skip tiny spreads
        if (event.deltaX === 0) return this._spreadTransform;

        // Determine if spreading in or out
        const sf = event.deltaX < 0 ? this._scaleFactor : 1 / this._scaleFactor;

        // Get the coordinates in the local coordinate system
        const { x, y } = applyToPoint(
            transform(this._spreadTransformInv, this._zoomTransformInv),
            this._toSVGCoordinates(event.clientX, event.clientY)
        );

        // Apply the spread to the spread matrix
        this._spreadTransform = transform(this._spreadTransform, scale(sf, sf, x, y));

        // Calculate the new inverse
        this._spreadTransformInv = inverse(this._spreadTransform);

        // Return the new spread transform
        return this._spreadTransform;

    }

    /**
     * Use a wheel event to create a new zoom matrix.
     */
    zoom (event: WheelEvent): Matrix {

        // Skip tiny zooms
        if (event.deltaY === 0) return this._zoomTransform;

        // Determine if zooming in or out
        const sf = event.deltaY < 0 ? this._scaleFactor : 1 / this._scaleFactor;

        // Get the coordinates in the local coordinate system
        const { x, y } = this._toLocalCoordinates(event.clientX, event.clientY);

        // Apply zoom to the transformation matrix
        this._zoomTransform = transform(this._zoomTransform, scale(sf, sf, x, y));

        // Calculate the new inverse
        this._zoomTransformInv = inverse(this._zoomTransform);

        // Return the new zoom transform
        return this._zoomTransform;

    }

    private _toLocalCoordinates (x: number, y: number): Vector2 {
        return applyToPoint(this._zoomTransformInv, this._toSVGCoordinates(x, y));
    }

    private _toSVGCoordinates (x: number, y: number): Vector2 {
        const ctm = this._svg.getScreenCTM();
        if (ctm) {
            this._pt.x = x;
            this._pt.y = y;
            const pt = this._pt.matrixTransform(ctm.inverse());
            return {
                x: pt.x,
                y: pt.y
            }
        }
        return { x, y };
    }

}

function toVector (event: MouseEvent): Vector2 {
    return {
        x: event.clientX,
        y: event.clientY
    }
}

export { Gesture };