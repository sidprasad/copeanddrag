//note: run on DATUM ID 3

const stage = new Stage()
const boardGridProps = {
    grid_location: {
        x: 0,
        y:0
    },
    cell_size: {
        x_size:15,
        y_size:15
    },
    grid_dimensions:{
        y_size:3,
        x_size:3
    }
}

function findAtom(v) {
  switch(v) {
    case 1: return A; 
    case 2: return B; 
    default: return C; 
  }
}

function makeNewGrid(boardAtom){
    let returnGrid = new Grid(boardGridProps)
    for (r = 1; r <= 3; r++) {
        for (c = 1; c <= 3; c++) {
          const text = boardAtom.places[findAtom(r)][findAtom(c)].toString().substring(0,1)
          const cellObject = new TextBox(text)
          returnGrid.add({y:r-1,x:c-1}, cellObject) 
        }
      }
    console.log(returnGrid)
    return returnGrid
}

const multiBoardGridProps = {
        grid_location: {
            x: 75,
            y:0
        },
        cell_size: {
            x_size:60,
            y_size:60
        },
        grid_dimensions:{
            y_size:9,
            x_size:2
        }
}

const multiBoardGrid = new Grid(multiBoardGridProps)

for(b = 0; b <= 9; b++) {  
    if(Board.atom("Board"+b) != null){

      const gridLabel = new TextBox(`Board ${b+1}`)
      const newGrid = makeNewGrid(Board.atom("Board"+b))
      multiBoardGrid.add({x:0,y:b},newGrid)
      multiBoardGrid.add({x:1,y:b},gridLabel)
    }
}

stage.add(multiBoardGrid);
stage.render(svg)


