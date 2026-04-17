//test conjunction of masks and edges
//note that this also includes use of global "stage" mask

const stage = new Stage()

const r1 = new Rectangle({height: 50, width: 50, center: {x:50,y:40}, color: "pink"})
const c1 = new Circle({radius: 45, center: {x:200, y:200}, color: "green"})
const e = new Edge({obj1: r1, obj2: c1})



stage.addAll([r1,c1, e])
stage.addMask({top_left: {x:80,y:80}, bottom_right: {x:150,y:150}})

stage.render(svg)
