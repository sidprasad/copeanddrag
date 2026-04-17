import { Circle } from '../Circle';
import { TextBox } from '../Textbox';
import { Rectangle } from '../Rectangle'
import { FuzzTestFactory } from './IntegrationTestEngine'

function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); 
}
/**
 * A more industrial suite of tests that generate many
 * random objects and add them to the DOM.
 *
 * This is implemented using the strategy pattern (FuzzTestFactory is the engine behind this suite)
 * and we define how to produce a random object, how to create an element that can be staged, and
 * optionally how to verify that an element in the DOM is properly represented by a set of characteristics
 *
**/
describe('Random tests for rendering shapes', () => {

  it('Can render many random rectangles', () => {
    const min_rand = 0, max_rand = 200;
    const produceRandomRectangleCharacteristics = () => 
    { 
      return {
        x: getRandomInt(min_rand, max_rand),
        y: getRandomInt(min_rand, max_rand),
        height: getRandomInt(min_rand, max_rand),
        width: getRandomInt(min_rand, max_rand)
      }
    }
    const produceRectangleFromCharacteristics = (chars: Record<string,number>) =>
    { 
      return new Rectangle({width: chars.width, height: chars.height, coords: {x: chars.x, y: chars.y}});
    }
    FuzzTestFactory('rect', produceRectangleFromCharacteristics, produceRandomRectangleCharacteristics)
  })

  it('Can render many random rectangles that are created by center', () => {
    const min_rand = 0, max_rand = 200;
    const produceRandomRectangleCharacteristics = () => 
    { 
      return {
        x: getRandomInt(min_rand, max_rand),
        y: getRandomInt(min_rand, max_rand),
        height: getRandomInt(min_rand, max_rand),
        width: getRandomInt(min_rand, max_rand)
      }
    }
    const produceRectangleFromCharacteristics = (chars: Record<string,number>) =>
    { 
      return new Rectangle({width: chars.width, height: chars.height, center: {x: chars.x, y: chars.y}});
    }

    /* 
     * As the dom will give us the coords for a rectangle by top left, we need to convert the expected
     * center (and to avoid floating point issues we use a epsilon value)
     */
    const eps = 0.0001
    const checkEquality = (obj: Element, characteristics: Record<string, Object>) => {
      const topLeftX = parseFloat(obj.getAttribute("x") ?? "0") 
      const topLeftY = parseFloat(obj.getAttribute("y") ?? "0") 
      const height = parseFloat(obj.getAttribute("height") ?? "1")
      const width = parseFloat(obj.getAttribute("width") ?? "1")
      const observedCenterX = topLeftX + width/2
      const observedCenterY = topLeftY + height/2
      const xDiff = Math.abs(observedCenterX - parseFloat(characteristics.x.toString()))
      const yDiff = Math.abs(observedCenterY - parseFloat(characteristics.y.toString()))
      return xDiff <= eps && yDiff <= eps 
      
    }
    FuzzTestFactory('rect', produceRectangleFromCharacteristics, produceRandomRectangleCharacteristics, checkEquality)
  }),
  it('Can render many random circles', () => {
    const min_rand = 0, max_rand = 200;
    const produceRandomCircleCharacteristics = () => 
    { 
      return {
        cx: getRandomInt(min_rand, max_rand),
        cy: getRandomInt(min_rand, max_rand),
        r: getRandomInt(min_rand, max_rand)
      }
    }
    const produceCircleFromCharacteristics = (chars: Record<string,number>) =>
    { 
      return new Circle({center : {x: chars.cx, y: chars.cy}, radius: chars.r})
    }
    FuzzTestFactory('circle', produceCircleFromCharacteristics, produceRandomCircleCharacteristics)
  })
  it('Can render many random textboxes', () => {
    const min_rand = 0, max_rand = 200;
    const randomString = () => 
    {
      const len = getRandomInt(min_rand, max_rand);
      let s = "";
      const A_CHAR_CODE = 65;
      for(let i = 0; i < len; i++)
      {
        s += String.fromCharCode(getRandomInt(A_CHAR_CODE,A_CHAR_CODE + 25));
      }
      return s
    }
    const produceRandomTextCharacteristics = () => 
    { 
      return {
        x: getRandomInt(min_rand, max_rand),
        y: getRandomInt(min_rand, max_rand),
        text: randomString()
      }
    }
    const produceTextFromCharacteristics = (chars: Record<string,Object>) =>
    { 
      return new TextBox({coords : {x: chars.x as number, y: chars.y as number},text: chars.text as string})
    }
    // as the text attribute of a text object gets stored in its innerHTML component, we define a custom
    // equality lambda
    const checkEquality = (obj: Element, characteristics: Record<string, Object>) => {
      let equalityFound = true;
      for(const [char_name, characteristic] of Object.entries(characteristics))
      {
        if(char_name == "text")
        {
          const textEquality = obj.innerHTML.trim() == characteristic.toString().trim()
          equalityFound = equalityFound && textEquality;
        }
        else
        {
          equalityFound = equalityFound && obj.getAttribute(char_name) === characteristic
        }
      }
      return equalityFound;
    }
    FuzzTestFactory('text', produceTextFromCharacteristics, produceRandomTextCharacteristics, checkEquality)
  })
})
