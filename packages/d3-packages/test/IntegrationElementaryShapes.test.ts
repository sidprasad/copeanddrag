/*
 * Proof of concept that we are able to simulate a DOM and inspect its elements
*/

import { Circle } from '../Circle';
import { Rectangle } from '../Rectangle'
import { Stage } from '../Stage'
import { Polygon } from '../Polygon'
import {  CreateMockSVG, VerifyObjectCharacteristics } from './IntegrationTestEngine'

describe('Rendering Elementary Shapes', () => {
  it('Can render a single circle', () => {
    const stage: Stage = new Stage()
    let svg = CreateMockSVG()

    const exp_cx = 150, exp_cy = 160, exp_r = 30;
    const c1: Circle = new Circle({ center: {x : exp_cx, y : exp_cy}, radius: exp_r })
    stage.add(c1)
    stage.render(svg)
    
    const circles: HTMLCollectionOf<SVGCircleElement> = svg.getElementsByTagName('circle')
    expect(circles.length).toBe(1)
    for(const circle of circles)
    {
      expect(VerifyObjectCharacteristics(circle, {
        cx: exp_cx.toString(),
        cy: exp_cy.toString(),
        r: exp_r.toString()
      })).toBe(true)
    }
  })
  it('Can render a single rectangle', () => {
    const stage: Stage = new Stage()
    let svg = CreateMockSVG()

    const exp_x = 150, exp_y = 200, exp_h = 123, exp_w = 4213;
    const r1: Rectangle = new Rectangle( { width: exp_w, height: exp_h, 
                                        coords: {x: exp_x, y : exp_y} } )
    stage.add(r1)
    stage.render(svg)

    const rects: HTMLCollectionOf<SVGRectElement> = svg.getElementsByTagName('rect');
    expect(rects.length).toBe(1)
    for(const rect of rects)
    {
      expect(VerifyObjectCharacteristics(rect, {
        x: exp_x.toString(),
        y: exp_y.toString(),
        height: exp_h.toString(),
        width: exp_w.toString()
      })).toBe(true)
    }
  })
  it('Can render a polygon', () => {
    const stage: Stage = new Stage()
    let svg = CreateMockSVG()
    
    const polypoints = [
      {x:100, y:50},
      {x:300, y:50},
      {x:100, y:150},
      {x:300, y:150}
    ]
    const strokeWidth = 2
    const borderWidth = 2
    const color = "orange"
    const borderColor = "black"
    const label = "Hi!"
    const labelColor = "black"
    const opacity = 0.7
    const poly = new Polygon({
      points: polypoints, 
      color: color, 
      borderWidth: borderWidth, 
      borderColor: borderColor, 
      label: label,
      labelColor: labelColor,
      opacity: opacity
    });
    stage.add(poly)
    stage.render(svg)

    const paths: HTMLCollectionOf<SVGPathElement> = svg.getElementsByTagName('path');
    expect(paths.length).toBe(1)
    const texts: HTMLCollectionOf<SVGTextElement> = svg.getElementsByTagName('text');
    expect(texts.length).toBe(1)

    for(const path of paths)
    {
      //console.log([...path.attributes].map(attr => attr.name))
      expect(VerifyObjectCharacteristics(path, {
        opacity: opacity.toString(),
        fill: color.toString(),
        stroke: borderColor.toString(),
        // This is brittle, but we had trouble finding a library method that auto-parsed this, so
        // adding this so we have some test for display of lines. 
        d: "M100,50L100,50L300,50L100,150L300,150Z"
      })).toBe(true)
    }
    for(const text of texts)
    {
        //console.log([...text.attributes].map(attr => attr.name))
        //console.log(text.firstChild?.textContent)
        // expect(VerifyObjectCharacteristics(text, {
        //   innerText: "Hi!"
        // })).toBe(true)
        expect(text.firstChild?.textContent).toBe("Hi!")
    }
  })

})
