
// //the table of ALL nodes (across all steps)
// const prim_nodes = pnodes.tuples() 

// //the table of ALL relations (across all steps)
// const prim_neighbors = ptree.tuples()

// function buildGraph(primNum){
//     //narrow down to just the nodes for our given step
//     const nodeAtoms = prim_nodes.filter(tuple => {
//     return tuple.atoms()[0].toString() == "Prim"+primNum.toString()})

//     //narrow down to just the relations for our given step
//     const neighbors = prim_neighbors.filter(tuple => {
//     return tuple.atoms()[0].toString() == "Prim"+primNum.toString()})
    
//     const nodes = []

//     //parse the above data into a list Node objects (see documentation)
//     //as this is what our graph data structure takes in
//     nodeAtoms.forEach(nodeAtom => {
//         const nodeID = nodeAtom.atoms()[1].toString()
//         const nodeNeighbors = neighbors.filter(neighbor => {
//             return neighbor.atoms()[1].toString() == nodeID
//          })
//          //toString() is something that most forge objects know, and so should
//          //be used liberally
//     .map(neighborAtom => neighborAtom.atoms()[2].toString())

//         newNode = {
//             name: nodeID,
//             neighbors: nodeNeighbors
//         }
//         nodes.push(newNode)
//     })

//     //the below is a neat trick: when we have very few elements the graphs
//     //usually look the best with at least 3 fixed nodes, so we consider the
//     //max of 3 and the square root of the number of nodes (a more general formula
//     //for computing this value given n nodes)
//     const num_fixed_nodes = Math.max(Math.floor(Math.sqrt(nodeAtoms.length)),3)
    
//     const returnGraph = new Graph({x:0,y:0},150,num_fixed_nodes,15)
//     returnGraph.add(nodes)

//     return returnGraph
// }

// const gridConfig = {
//         grid_location: {
//             x: 50,
//             y:50
//         },
//         cell_size: {
//             x_size:200,
//             y_size:200
//         },
//         grid_dimensions:{
//             y_size:2,
//             x_size:5
//         }
// }
// const graphsGrid = new Grid(gridConfig)
// let primState = 0
// //iterate over all atoms for which "Primk" is not null (increasing k's)
// while(Prim.atom("Prim"+primState.toString())!=null){
//     const textAdd = new TextBox(`Step ${primState+1}`,{x:0,y:0},"black",30)
//     graphsGrid.add({x:primState,y:0}, textAdd)
//     graphsGrid.add({x:primState,y:1}, buildGraph(primState))
//     primState++
// }

// //boilerplate
// const stage = new Stage()
// stage.add(graphsGrid)
// stage.render(svg, document)