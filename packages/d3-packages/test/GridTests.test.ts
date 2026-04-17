import { Grid } from '../Grid';
import { Rectangle } from '../Rectangle'
import { Stage } from '../Stage'
import {  CreateMockSVG, VerifyObjectCharacteristics } from './IntegrationTestEngine'

/*
Adapted from the gridtest.js demo.

The intended output is a 3x3 grid with squares in its corner cells, and a 3x3 grid in its inside cell
    The inner grid has the same pattern, with an even smaller 3x3 grid in its inner cell
      The innermost grid has tiny rectangles in all 9 cells. 

  To check offsetting, the middle left grid cell should contain an offset rectangle, slightly to the 
  right and down from the cell's center. The offset rectangle will be blue and taller than it is wide.  

  TODO:
  For the moment, this test only checks the object properties, not the rendered elements
*/

const bigGridConfig = {
    grid_location :{
        x:10,
        y:10
    },
    cell_size:{
        x_size:150,
        y_size:150
    },
    grid_dimensions:{
        y_size:3,
        x_size:3
    }
}
const smallGridConfig = {
    grid_location :{
        x:0,
        y:0
    },
    cell_size:{
        x_size:45,
        y_size:45
    },
    grid_dimensions:{
        y_size:3,
        x_size:3
    }
}
const smallerGridConfig = {
    grid_location :{
        x:0,
        y:0
    },
    cell_size:{
        x_size:10,
        y_size:10
    },
    grid_dimensions:{
        y_size:3,
        x_size:3
    }
}

describe('Rendering Nested Grid', () => {
  it('Nested grid alignment check with offsets', () => {
    // Not looking at the DOM in this test yet
    //const stage: Stage = new Stage()
    //let svg = CreateMockSVG()

    const bigGrid = new Grid(bigGridConfig)
    bigGrid.sterlingExpectCenter("bigGrid", 235, 235) 

    for(let i = 0; i < 3; i++){
      for(let j =0; j<3; j++){
        if(j != 1 && i != 1){
          const newRect = new Rectangle({height: 140, width: 140});
          // This rectangle will automatically have a center() value of {x:70,y:70}; if 
          // that isn't the case, raise an alarm while running this test.
          newRect.sterlingExpectCenter("upper-left rectangle on creation", 70, 70)
          bigGrid.add({x:i,y:j}, newRect)
        }
      }
    }

    const offsetRect = new Rectangle({height: 50, width: 30, center:{x:45,y:25}, color:'blue'});
    // starts out with only its own parameters (here we provide center)
    offsetRect.sterlingExpectCenter("offsetRect", 45, 25) 
    bigGrid.add({x:0,y:1}, offsetRect)
    // After being added to the grid, we expect the offset to be preserved
    // y: one cell down (150) + cell center (75) + offset (25)
    // x: first cell (0) + cell center (75) + offset (50)
    offsetRect.sterlingExpectCenter("offsetRect", 130, 260) 

    const smallGrid = new Grid(smallGridConfig)
    // This sub-grid will automatically have a center() value of {x:0,y:0}; if 
    // that isn't the case, raise an alarm while running this test. (45*3 = 135; 135 / 2 = 67.5)
    smallGrid.sterlingExpectCenter("smallGrid on creation", 67.5, 67.5)
    for(let i = 0; i < 3; i++){
        for(let j =0; j<3; j++){
          if(i != 1 && j!= 1){
            const newRect = new Rectangle({height: 40,width: 40});
            smallGrid.add({x:i,y:j}, newRect)
          }        
        }
    }


    const smallerGrid = new Grid(smallerGridConfig)
    for(let i = 0; i < 3; i++){
        for(let j =0; j<3; j++){
            const newRect = new Rectangle({height: 9, width: 9});
            smallerGrid.add({x:i,y:j}, newRect)
        }
    }
    
    bigGrid.add({x:1,y:1}, smallGrid)    
    smallGrid.add({x:1,y:1},smallerGrid)

    // Expect the offsets to apply together with the parent locations, now.
    // Because the smaller grid is in the very center, the centers are the same:
    smallGrid.sterlingExpectCenter("smallGrid", 235, 235) 
    smallerGrid.sterlingExpectCenter("smallerGrid", 235, 235) 

    // Don't render; we're not looking at the DOM in this test yet.
    //stage.add(bigGrid)
    //stage.render(svg)    
  })
})
