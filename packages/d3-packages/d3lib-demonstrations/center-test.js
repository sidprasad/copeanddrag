const gridRectProps = {
    grid_location :{
        x:0,
        y:0
    },
    cell_size:{
        x_size:25,
        y_size:25
    },
    grid_dimensions:{
        y_size:10,
        x_size:10
    }
}
const referenceGrid = new Grid(gridRectProps)

/*
both of the below rectangles should have their
centers at (100,100)

although we verify this with the testing functionality
it is hoped that one would verify this result visually:
The expected visual is two rectangles layered on each other
*/
const centerOriented = new Rectangle({height: 100, width: 100, 
                center: {x: 100, y: 100}});
const topLeftOriented = new Rectangle({height: 100, width: 100,
                coords: {x:50, y:50}})

centerOriented.sterlingExpectCenter("center oriented rect", 100, 100)
topLeftOriented.sterlingExpectCenter("top left oriented rect", 100, 100)
 

const s = new Stage()
s.add(referenceGrid)
s.add(centerOriented)
s.add(topLeftOriented)
s.render(svg)


