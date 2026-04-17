import { svgArcEndpointToCenter } from '../geometricHelpers'

test("svgArcEndpointToCenter: initial test", () => {
    const input = {
        x1: 200,y1: 200,rx: 50,ry: 50, phi: 0, 
        fA: true, fS: true, x2: 300, y2: 200}
    const output = svgArcEndpointToCenter(input)
    expect(output.cx).toBe(250)
    expect(output.cy).toBe(200)
    expect(output.clockwise).toBe(true)
    expect(output.rx).toBe(50)
    expect(output.ry).toBe(50)
    expect(output.startAngle).toBeCloseTo(Math.PI)
    expect(output.deltaAngle).toBeCloseTo(Math.PI)
    expect(output.endAngle).toBeCloseTo(2 * Math.PI)
});
