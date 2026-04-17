import { toFunc, Coords, BoundingBox, boxUnion } from "./Utility";
import {bounding_box_to_lambda} from "./geometricHelpers"
import * as d3 from 'd3';
import {SCREEN_WIDTH, SCREEN_HEIGHT} from './Constants'
export type {Coords};

/**
 * To anyone adding to this library in the future: please take the following steps when adding
 * new VisualObjects.
 *
 * 1. If the object is to be accessible within sterling, add it to library within ScriptViewImports.
 * 2. Add the name of the file, minus .d.ts, to the list within d3lib-def-compiler/src/D3LibDefCompiler.java.
 *    Make sure to add the name to the end of the list, following any files it imports.
 * 3. Run the typescript compiler ("tsc" in terminal) from within the d3-packages folder.
 * 4. Run the main method within D3LibDefCompiler.
 *
 * If these steps are not followed, the file's definitions will either not be accessible within
 * sterling, or will not show up in monaco.
 */

export type BoundingBoxGenerator = (r: number) => Coords;

export class VisualObject {
  /** The center of the object (possibly adjusted by object-specific logic or parent logic. 
   *  E.g., a Rectangle may have (0,0) as origin, but its center will be set to its middle.
  */
  center: () => Coords;
  /** The original origin of the object as passed to its constructor; used for offset 
   *  calculation in container objects like grids. This should not be modified, since 
   *  it represent's the caller's intent for an offset from the context origin.
   */
  origin_offset: () => Coords;
  children: VisualObject[];
  dependents: VisualObject[];

  //note: for non-circle objects, we leave the below
  //uninitialized! Bad typescript sorry :((
  bounding_box_lam: BoundingBoxGenerator;
  hasBoundingBox: boolean;
  masks: BoundingBox[];


  /**
   * Top level class, which all other visual objects will extend.
   * @param coords position of the object on screen.
   */
  constructor(coords?: Coords | (() => Coords)) {
    this.center = toFunc({ x: 0, y: 0 }, coords);
    this.origin_offset = toFunc({ x: 0, y: 0 }, coords);    
    this.bounding_box_lam = (r: number) => { return this.center() };
    this.hasBoundingBox = false;
    this.children = [];
    this.dependents = [];
    this.masks = [];
  }

  boundingBox(): BoundingBox {
    if (this.children.length == 0) {
      return {top_left: this.center(), bottom_right: this.center()}
    } else {
      // Defaults to returning bounding box of all children. 
      return boxUnion(this.children.map((child): BoundingBox => child.boundingBox()))
    }
  }

  getChildren(): VisualObject[]{
    return this.children;
  }
  /**
   * Shifts object to have new given center
   * @param center new center of the object
   */
  setCenter(center: Coords | (() => Coords)) {
    this.center = toFunc(this.center(), center);
  }

  hasLam():Boolean{
    return this.hasBoundingBox;
  }
  getLam(): BoundingBoxGenerator {
    if(this.hasBoundingBox){
      return this.bounding_box_lam;
    }
    else{
      return bounding_box_to_lambda(this.boundingBox());
    }
  }

  addMask(mask: BoundingBox) {
    this.masks.push(mask);
  }
  /**
   * Method should not be called outside of internal backend!
   *
   * @param masks Masks to be applied to svg
   * @param SVG HTML Svg object to which the object should be rendered.
   * 
   * @returns a unique identifier to the mask (used to ID the mask)
   */
  addMaskRender(masks: BoundingBox[], svg: any): string {
    if(masks.length <= 0){
      return "0";
    }
    const maskIdentifier:string = window.performance.now().toString();
    console.log("mask identifier in addMask func:" + maskIdentifier)
    const mask = d3
      .select(svg)
      .append('defs')
      .append('mask')
      .attr('id', maskIdentifier);
    mask //"background" mask. Not sure why this works but it does
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', SCREEN_WIDTH)
      .attr('height', SCREEN_HEIGHT)
      .style('fill', 'white')
      .style('opacity', 1);
    if (masks instanceof Array && masks) {
      masks.forEach((m) => {
        mask.append('rect')
        .attr('x', m.top_left.x)
        .attr('y', m.top_left.y)
        .attr('width', Math.abs(m.top_left.x - m.bottom_right.x))
        .attr('height', Math.abs(m.top_left.y - m.bottom_right.y))
      });
    } 
    return maskIdentifier;
  }

  /**
   * Renders the object to the screen.
   * @param svg HTML Svg object to which the object should be rendered.
   */
  render(svg: any, parent_masks?: BoundingBox[]) {
    let render_masks: BoundingBox[];
    if (parent_masks) {
      render_masks = this.masks.concat(parent_masks);
    } else {
      render_masks = this.masks;
    }
    this.children.forEach((child: VisualObject) => {child.render(svg, render_masks)});
  }

  /**
   * Helper function used for internal testing outside Jest, since SVG elements are not 
   * always easy to inspect (e.g., <path> strings)
   * @param label a string label for this test case
   * @param x the expected x coordinate of this object's center
   * @param y the expected y coordinate of this object's center
   */
  sterlingExpectCenter(label: string, x: number | undefined, y: number | undefined) {
    if(this.center().x !== x) 
      throw new Error(`${label}: center().x was not expected value (${x}); was ${this.center().x}`)
    if(this.center().y !== y) 
      throw new Error(`${label}: center().y was not expected value (${y}); was ${this.center().y}`)
  }
}
