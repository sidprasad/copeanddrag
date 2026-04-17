import { CreateMockSVG, VerifyObjectCharacteristics } from './IntegrationTestEngine'
import { Rectangle } from '../Rectangle'
import { Stage } from '../Stage'

describe('Verify re-rendering related functionality', () => {
  it('does not render components that have been removed', () => {
    const stage:Stage = new Stage()
    let svg = CreateMockSVG()

    const testRect = new Rectangle({width: 10, height: 10, center: {x:10, y:10}})
    stage.add(testRect)
    stage.render(svg)

    stage.remove(testRect)
    stage.render(svg)
    
    const rects: HTMLCollectionOf<SVGRectElement> = svg.getElementsByTagName('rect')
    expect(rects.length).toBe(0)
  }),
  it('only renders elements that have not been removed', () => {
    const stage:Stage = new Stage()
    let svg = CreateMockSVG()

    const removedX = 30, removedY = 35, removedH = 40, removedW = 60;
    const persistentX = 20, persistentY = 25, persistentH = 30, persistentW = 50;
    const removeRect = new Rectangle({width: removedW, height: removedH, coords: {x:removedX, y:removedY}})
    const persistRect = new Rectangle({width: persistentW, height: persistentH, coords: {x:persistentX, y:persistentY}})
    stage.add(removeRect)
    stage.add(persistRect)
    stage.render(svg)
    stage.remove(removeRect)
    stage.render(svg)
    
    const rects: HTMLCollectionOf<SVGRectElement> = svg.getElementsByTagName('rect')
    expect(rects.length).toBe(1)
    for(const rect of rects)
    {
      expect(VerifyObjectCharacteristics(rect, {
        x: persistentX.toString(),
        y: persistentY.toString(),
        height: persistentH.toString(),
        width: persistentW.toString()
      })).toBe(true)
    }
  })
  it('properly re-renders components with updated characteristics', () => {
    const stage:Stage = new Stage()
    let svg = CreateMockSVG()

    const oldX = 10, oldY = 10, oldHeight = 10, oldWidth = 10;
    const testRect = new Rectangle({width: oldWidth, height: oldHeight, coords: {x:oldX, y:oldY}})
    stage.add(testRect)
    const newWidth = 40, newHeight = 40
    testRect.setWidth(newWidth)
    testRect.setHeight(newHeight)
    stage.render(svg)
    const rects: HTMLCollectionOf<SVGRectElement> = svg.getElementsByTagName('rect')
    expect(rects.length).toBe(1)
    for(const rect of rects)
    {
      expect(VerifyObjectCharacteristics(rect, {
        x: oldX.toString(),
        y: oldY.toString(),
        height: newHeight.toString(),
        width:newWidth.toString() 
      })).toBe(true)
    }
  })
})
