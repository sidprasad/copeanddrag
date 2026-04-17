import { Edge } from '../Edge';
import { Rectangle } from '../Rectangle';
import { Circle } from '../Circle';
import { TextBoxProps, TextBox } from '../Textbox';
import { VisualObject } from '../VisualObject';

import {
  distance,
  mid_point,
  get_minimum_distance,
  bounding_box_to_lambda
} from '../geometricHelpers';

import { Coords } from '../Utility';
//note: had to run
//  yarn node --experimental-vm-modules $(yarn bin jest)
// for tests to work
describe('Mid Point Unit Tests', () => {
  //consider the point (0,0) and (10,10). The mid point should be //(5,5)
  it('calculates mid point correctly for simple case', () => {
    const p1: Coords = { x: 0, y: 0 };
    const p2: Coords = { x: 10, y: 10 };

    const midpoint: Coords = mid_point(p1, p2);
    const expectedMidPoint: Coords = { x: 5, y: 5 };
    expect(midpoint.x).toBe(expectedMidPoint.x);
    expect(midpoint.y).toBe(expectedMidPoint.y);
  });
  it('calculates mid point correctly for same point', () => {
    const p1: Coords = { x: 10, y: 10 };
    const p2: Coords = { x: 10, y: 10 };

    const midpoint: Coords = mid_point(p1, p2);
    const expectedMidPoint: Coords = { x: 10, y: 10 };
    expect(midpoint.x).toBe(expectedMidPoint.x);
    expect(midpoint.y).toBe(expectedMidPoint.y);
  });
  it('Calculates midpoint for vertical points', () => {
    const p1: Coords = { x: 0, y: 10 };
    const p2: Coords = { x: 10, y: 10 };

    const midpoint: Coords = mid_point(p1, p2);
    const expectedMidPoint: Coords = { x: 5, y: 10 };
    expect(midpoint.x).toBe(expectedMidPoint.x);
    expect(midpoint.y).toBe(expectedMidPoint.y);
  });
});
describe('Text Location Tests', () => {
  it('Correctly places text in right case', () => {
    const c1: Circle = new Circle({ center: { x: 150, y: 150 }, radius: 30 });
    const c2: Circle = new Circle({ center: { x: 400, y: 400 }, radius: 30 });
    const textprops: TextBoxProps = { text: 'hi' };
    const e: Edge = new Edge({
      obj1: c1,
      obj2: c2,
      textProps: textprops,
      textLocation: 'right'
    });

    const eChildren: VisualObject[] = e.children;

    //dummy object
    let textObject: VisualObject = new Circle({ radius: 50 });

    //first verify that our edge has a text object as a child
    eChildren.forEach((child) => {
      if (child.hasOwnProperty('text')) {
        textObject = child; //only textbox has such a property
      }
    });

    //verify that our object has changed from a circle to a textobject
    //(typescript moment)
    expect(textObject.hasOwnProperty('text')).toBeTruthy();

    //then verify that this child's location is as desired (285.8961226876293, y: 263.8683105336104)
    //above computed by hand
    expect(textObject.center().x).toBeGreaterThan(285);
    expect(textObject.center().x).toBeLessThan(286);
    expect(textObject.center().y).toBeGreaterThan(263);
    expect(textObject.center().y).toBeLessThan(264);
  });
  it('Correctly places text in left case', () => {
    const c1: Circle = new Circle({ center: { x: 150, y: 150 }, radius: 30 });
    const c2: Circle = new Circle({ center: { x: 400, y: 400 }, radius: 30 });
    const textprops: TextBoxProps = { text: 'hi' };
    const e: Edge = new Edge({
      obj1: c1,
      obj2: c2,
      textProps: textprops,
      textLocation: 'left'
    });

    const eChildren: VisualObject[] = e.children;

    //dummy object
    let textObject: VisualObject = new Circle({ radius: 50 });

    //first verify that our edge has a text object as a child
    eChildren.forEach((child) => {
      if (child.hasOwnProperty('text')) {
        textObject = child; //only textbox has such a property
      }
    });

    //verify that our object has changed from a circle to a textobject
    //(typescript moment)
    expect(textObject.hasOwnProperty('text')).toBeTruthy();

    //same case as above, but correct object point is 
    //{x: 264.1038773123707, y: 286.1316894663896}
    expect(textObject.center().x).toBeGreaterThan(264);
    expect(textObject.center().x).toBeLessThan(265);
    expect(textObject.center().y).toBeGreaterThan(286);
    expect(textObject.center().y).toBeLessThan(287);
  });
  it('Correctly places text in above case', () => {
    const c1: Circle = new Circle({ center: { x: 150, y: 150 }, radius: 30 });
    const c2: Circle = new Circle({ center: { x: 400, y: 150 }, radius: 30 });
    const textprops: TextBoxProps = { text: 'hi' };
    const e: Edge = new Edge({
      obj1: c1,
      obj2: c2,
      textProps: textprops,
      textLocation: 'above'
    });

    const eChildren: VisualObject[] = e.children;

    //dummy object
    let textObject: VisualObject = new Circle({ radius: 50 });

    //first verify that our edge has a text object as a child
    eChildren.forEach((child) => {
      if (child.hasOwnProperty('text')) {
        textObject = child; //only textbox has such a property
      }
    });

    //verify that our object has changed from a circle to a textobject
    //(typescript moment)
    expect(textObject.hasOwnProperty('text')).toBeTruthy();

    //same case as above, but correct object point is 
    //{x: 275, y: 134.4230940171034}
    expect(textObject.center().x).toBe(275)
    expect(textObject.center().y).toBeGreaterThan(134);
    expect(textObject.center().y).toBeLessThan(135);
  });
  it('Correctly places text in below case', () => {
    const c1: Circle = new Circle({ center: { x: 150, y: 150 }, radius: 30 });
    const c2: Circle = new Circle({ center: { x: 400, y: 150 }, radius: 30 });
    const textprops: TextBoxProps = { text: 'hi' };
    const e: Edge = new Edge({
      obj1: c1,
      obj2: c2,
      textProps: textprops,
      textLocation: 'below'
    });

    const eChildren: VisualObject[] = e.children;

    //dummy object
    let textObject: VisualObject = new Circle({ radius: 50 });

    //first verify that our edge has a text object as a child
    eChildren.forEach((child) => {
      if (child.hasOwnProperty('text')) {
        textObject = child; //only textbox has such a property
      }
    });

    //verify that our object has changed from a circle to a textobject
    //(typescript moment)
    expect(textObject.hasOwnProperty('text')).toBeTruthy();

    //same case as above, but correct object point is 
    //{x: 275, y: 134.4230940171034}
    expect(textObject.center().x).toBe(275)
    expect(textObject.center().y).toBeGreaterThan(165);
    expect(textObject.center().y).toBeLessThan(166);
  });

});

/*
TODO:

- test edge text locations
- More thorough points
- Horizontal / Vectical lines !!!!!!

Additional test files:
- TREE TEST
- Utility helpers tests!!!!
- Mask test!!! (though this is hard to actually verify)
*/
