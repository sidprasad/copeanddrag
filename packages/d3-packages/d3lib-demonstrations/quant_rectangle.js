const stage = new Stage();




const init_point = {x:50,y:500}
const x_offset_1 = 450
const y_offset = 200
const x_offset_2 = 50


const circ1 = new Circle({radius: 30, center: {x:init_point.x + x_offset_2,y:init_point.y-y_offset}});
const circ2 = new Circle({radius: 30, center: {x:init_point.x + x_offset_1 - x_offset_2,y:init_point.y-y_offset}});
const circ3 = new Circle({radius: 30, center: {x: init_point.x + x_offset_1, y: init_point.y}})
const circ4 = new Circle({radius: 30, center: init_point})


const c1c2 = new Edge({obj1: circ1, obj2: circ2, textProps:{text: "heya"}, textLocation: "above"})
const c2c3 = new Edge({obj1: circ2, obj2: circ3, textProps:{text: "howdy"}, textLocation: "above"})
const c3c4 = new Edge({obj1:circ3, obj2: circ4, textProps:{text: "hi"}, textLocation: "above"})
const c4c1 = new Edge({obj1:circ4, obj2: circ1, textProps:{text: "aloha"}, textLocation: "above"})
// const edgeParams = {
//    obj1: circ1,
//    obj2: circ2
// }




// const edge = new Edge(edgeParams)


stage.add(circ1)
stage.add(circ2)
stage.add(circ3)
stage.add(circ4)
stage.add(c1c2)
stage.add(c2c3)
stage.add(c3c4)
stage.add(c4c1)




stage.render(svg, document)





