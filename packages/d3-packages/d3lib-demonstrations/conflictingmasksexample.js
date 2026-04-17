//this offers a demonstration of the mask isolation for masks
// note that the first mask added to rect 2 *should* overlap with rect1, but
//because of mask isolation, it doesn't!

const stage = new Stage()






const rect1 = new Rectangle({center: {x: 50, y:50}, width: 400, height: 400})




rect1.addMask({top_left: {x:0,y:0}, bottom_right: {x:100,y:100}})
rect1.addMask({top_left: {x:150,y:150}, bottom_right: {x:300, y:300}})


const rect2 = new Rectangle({center: {x:50, y:500}, width: 400, height:400})
rect2.addMask({top_left: {x:0, y:0}, bottom_right: {x:300,y:300}})
//proof that masks don't overlap!

rect2.addMask({top_left: {x:75,y:200}, bottom_right: {x:100,y:700}})




stage.addAll([rect1, rect2])
stage.render(svg)
