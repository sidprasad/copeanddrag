import { interpolateZoom } from 'd3-interpolate';
import { applyToPoint, compose, Matrix, scale, translate, inverse } from 'transformation-matrix';

export interface MatrixInterplator {
    (t: number): Matrix
    duration: number
}

/**
 * An experimental function to create an interpolator that uses d3.interpolateZoom.
 * The d3.interpolateZoom function works with ZoomViews, which are a centerpoint and
 * a viewport width, but we need everything in term of affine transformation matrices.
 * This is an attempt to adapt it for that case. It works, but it doesn't quite feel
 * right. The zoom arc tends to favor one direction and gets way too big when the scale
 * difference is large. Also, the types for interpolateZoom.rho are incorrect, hence
 * the ts-ignore flag.
 */
export function interpolateTransform (a: Matrix, b: Matrix, width: number, height: number): MatrixInterplator {

    const ai = inverse(a);
    const origin = applyToPoint(ai, { x: 0, y: 0});
    const dims = applyToPoint(ai, { x: width, y: height});
    const diff = { x: dims.x - origin.x, y: dims.y - origin.y };
    const centerStartPoint = applyToPoint(ai, { x: width/2, y: height/2 });
    const start: [number, number, number] = [centerStartPoint.x, centerStartPoint.y, Math.min(diff.x, diff.y)];
    const end: [number, number, number] = [width/2, height/2, Math.min(width, height)];
    // @ts-ignore
    const interpolate = interpolateZoom.rho(0.25)(start, end);

    const interp = (t: number) => {
        const view = interpolate(t);
        const k = Math.min(width, height) / view[2];
        const tr = [width / 2 - view[0] * k, height / 2 - view[1] * k];
        return compose(
            translate(tr[0], tr[1]),
            scale(k, k)
        )
    };

    interp.duration = interpolate.duration;
    return interp;
}