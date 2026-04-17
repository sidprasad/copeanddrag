
import { JSDOM } from 'jsdom';
import { Stage } from '../Stage'
import { VisualObject } from '../VisualObject'
/**
 * Gives a mock SVG that will behave exactly like a browser would
 *
  **/
export function CreateMockSVG()
{
    const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
    const document = dom.window.document;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    return svg;
}
/**
 * Given an SVG object and a dictionary representing its expected characteristics,
 * verifies that all these characteristics are present and that their contents
 * match the contents specified in the map
**/
export function VerifyObjectCharacteristics(obj: any, expected_characteristics: Record<string, string>)
{
  let object_equality = true;
  for(const [characteristic, expected_value] of Object.entries(expected_characteristics))
  {
    const actualValue = obj.getAttribute(characteristic)
    const isEq = (actualValue === expected_value)
    object_equality = object_equality && isEq
    if(!isEq) { 
      console.log(`Verifying object characteristics failed; field ${characteristic} was ${actualValue}; expected ${expected_value}.`)
      console.log(`Object was: ${JSON.stringify(obj)}`)
    }
  }
  return object_equality
}

/**
 * Fuzz testing from strategy pattern:
 *
 * Takes in a tagName for an object, a function to produce the characteristics of this object,
 * and a function to produce instances of the object from this characteristic, and an optional verifier
 *
 * then verifies that producing random instances of this object will properly generated into the SVG.
 *
 *
**/
function collectElements<T extends Element>(collection: HTMLCollectionOf<T>): T[] {
    return Array.from(collection);
}
interface Stringifiable {
    toString(): string;
}
export function FuzzTestFactory<T extends Stringifiable>(tagName: string,
                                objFactory: ((a: Record<string,T>) => VisualObject),
                                objCharacteristicFactory: (() => Record<string,T>),
                                objEquality: any = VerifyObjectCharacteristics)
{
  const stage: Stage = new Stage();
  let svg = CreateMockSVG();
  
  const numObjects = 100;
  let expectedObjects: Record<string,string>[] = [];
  for(let i = 0; i < numObjects; i++)
  {
    const objData: Record<string, T> = objCharacteristicFactory();
    const obj = objFactory(objData);
    stage.add(obj);
    const stringifiedCharacteristics: Record<string,string> = {};
    for(const [attr, val] of Object.entries(objData))
    {
      stringifiedCharacteristics[attr] = val.toString();
    }
    expectedObjects.push(stringifiedCharacteristics)
  }
  stage.render(svg)
  const foundObjects: Element[] = collectElements(svg.getElementsByTagName(tagName));
  for(const expObjData of expectedObjects) 
  {
      let locatedObjIndex = -1;
      let foundObjIndex = false;
      for(let index = 0; index < foundObjects.length && !foundObjIndex; index++)
      {
        if(objEquality(foundObjects[index], expObjData))
        {
          locatedObjIndex= index;
          foundObjIndex = true;
        }
      }
      //internal check of test logic:
      expect((locatedObjIndex === -1) === (!foundObjIndex)).toBeTruthy(); 

      expect(foundObjIndex).toBeTruthy();
  }

}
