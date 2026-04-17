// import {VisualObject, Coords} from './VisualObject'
// import {DEFAULT_GRAPH_FIXED_NODES, DEFAULT_NODE_RADIUS, SCREEN_WIDTH} from './Constants'
// import { Line } from './Line'
// import {Circle} from './Circle'
// import {TextBox} from './TextBox'
// import {ConjoinedObject} from './ConjoinedObject'

// export interface Node{
//     name: string,
//     neighbors: string[]
// }

// export class Graph extends VisualObject{
//     nodes: Node[]
//     node_radius:number
//     fixed_nodes:number
//     graph_dimensions:number 
//     //aside: we build our graphs in a square box by convention
//     //and so this need only be a single number

//     node_to_location:any //a map from node names to the "coordinates" of that node (we use this to track where our nodes our)
//     //note that for the simplicity of our algorithm, node_to_location refers to the coordinates of the node WHERE (0,0) IS THE
//     //TOP LEFT OF OUR GRAPH GRAPHIC SQUARE. Offset is handled in the rendering of the objects
    
//     constructor(coords?:Coords, graph_dimensions?:number,fixed_nodes?:number,node_radius?:number,){
//         /**
//          * 
//          * @param coords: the location of the square containing the entire graph visual
//          * @param graph_dimensions: the height/width of the graph visual square (for simplicity graph is always
//          * visualized in a square)
//          * @param fixed_nodes: the number of nodes we want graphically distributed on the edges of our graphic (if
//          * you don't care about this it should just be 4)
//          * @param node_radius: the graphical size of each node
//          */
//         super(coords)
//         this.nodes = []
//         this.graph_dimensions = graph_dimensions ?? SCREEN_WIDTH
//         this.node_radius = node_radius ?? DEFAULT_NODE_RADIUS
//         this.fixed_nodes = fixed_nodes ?? DEFAULT_GRAPH_FIXED_NODES
//         this.node_to_location = {}
//     }

//     override setCenter(center:Coords){
//         /**
//          * As the graph is just represented as a square, this is a copy of the method setCenter for the rectangle
//          */
//         this.coords = {
//             x: center.x - this.graph_dimensions/2,
//             y: center.y - this.graph_dimensions/2
//         }
//     }
//     override center(){
//         return {
//             x: this.coords.x + this.graph_dimensions/2,
//             y: this.coords.y + this.graph_dimensions/2
//         }
//     }

//     add(Nodes: Node[]){
//         /**
//          * The algorithm for setting the locations of our graph nodes works as follows:
//          * 
//          * Fix the location of n nodes around the corners of the image (we choose the n nodes with the most 
//          * connections to minimize the graphical damage of this)
//          * 
//          * Compute the "new" locations of each of our remaining nodes -> for each node, its new location is the
//          * average location of its neighbors. After each new location is computed, we move these new nodes to their
//          * respective locations.
//          * 
//          * The above step is then repeated k times (for some k > 1000), and by the magic of graph theory our
//          * graph won't look terrible
//          */
//         this.nodes = this.nodes.concat(Nodes)
//         this.check_add_set(this.nodes) 

//         this.nodes.sort((a,b) => { //we the n nodes of highest relevance for our corner nodes
//             if(a.neighbors.length > b.neighbors.length) {return 1}
//             else if(b.neighbors.length > a.neighbors.length) {return -1}
//             else{return 0}
//         })

//         const fixed_nodes = this.nodes.slice(0, this.fixed_nodes)
//         this.set_fixed_nodes(fixed_nodes)

//         const malleable_nodes = this.nodes.slice(this.fixed_nodes) //the nodes we are are going to be changing the locations of
//         malleable_nodes.forEach(node => { //set initial locations (center of screen)
//             this.node_to_location[node.name] = {x:this.graph_dimensions /2, y: this.graph_dimensions/2}
//         })

//         for(let ignored = 0; ignored<10000; ignored++){
//             this.set_malleable_nodes(malleable_nodes)
//         }

//     }


//     private set_fixed_nodes(Nodes:Node[]){
//         /**
//          * We distribute the location of our fixed nodes evenly across the circle of our specified radius
//          */
//         const n = Nodes.length
//         const r =  this.graph_dimensions/2 //radius
//         let i = 0
//         Nodes.forEach((node) => {
//             i++
//             this.node_to_location[node.name] = {
//                 x: this.graph_dimensions/2 + r*Math.cos(i*(2*Math.PI)/n),
//                 y: this.graph_dimensions/2 + r*Math.sin(i*(2*Math.PI)/n)
//             }
//         })
//     }

//     private set_malleable_nodes(malleable_nodes:Node[]){
//         /**
//          * One iteration of our algorithm to align the points
//          * 
//          * Given a set of non-fixed nodes (see add method for description of this algo), set each nodes
//          * location to the avg location of its neighbors
//          */
//         let newLocations = {}

//         malleable_nodes.forEach((node) => { //iterate over malleable nodes
//             const neighbor_locations:Coords[] = node.neighbors.map(neighbor => {
//                 return {x:this.node_to_location[neighbor].x, y: this.node_to_location[neighbor].y}
//             })

//             let sum_neighbor_x = 0 //compute avg location of neighbors
//             let sum_neighbor_y = 0
//             neighbor_locations.forEach((location) => {
//                 sum_neighbor_x += location.x;
//                 sum_neighbor_y += location.y;
//             })
//             newLocations[node.name] = {
//                 x: sum_neighbor_x/neighbor_locations.length,
//                 y: sum_neighbor_y/neighbor_locations.length
//             }
//         })
//         malleable_nodes.forEach(element => {
//             this.node_to_location[element.name] = newLocations[element.name]
//         });
//     }


    
//     check_add_set(Nodes:Node[]){
//         /**
//          * Given a set of nodes, we verify that these nodes satisfy the following conditions:
//          * 
//          * 1. No node is named twice (i.e. we can't have two nodes named 'i')
//          * 2. Each neighbor of the node is a valid node (i.e. if we have node i such that
//          * i.neighbors = ['j','k','m'], then we also have nodes 'j','k','m' in our set)
//          * 
//          * 
//          * As an aside, we want this method to be private, except that it's used in the Tree class
//          */
//         const node_names = new Set<string>([])

//         Nodes.forEach(node => { //build up our set of node names, checking for duplicates in the process
//             if(node_names.has(node.name)){
//                 const error = `Repeat node. Found duplicate of node ${node.name}`
//                 throw error
//             }
//             node_names.add(node.name)
//         })

//         Nodes.forEach(node => { //check that each of the neighbors listed by our nodes is in the above node_names set
//             node.neighbors.forEach(neighbor => {
//                 if(!node_names.has(neighbor)){
//                     const error = `Neighbor not found. Was unable to find node ${neighbor} in set of nodes`
//                     throw error
//                 }
//             })
//         })


        
//     }

//     override render(svg){
//         const unparseableConnections = new Set<string>() //find all UNIQUE connections (if A -> B and B -> A we don't want
//         //two different lines)
//         this.nodes.forEach(node => {
//             node.neighbors.forEach(neighbor => {
//                 const connection = node.name + "," + neighbor
//                 if(!unparseableConnections.has(neighbor + "," + node.name)){
//                     unparseableConnections.add(connection)
//                 }
//             })
//         })
        
//         const connections:string[][] = []
//         unparseableConnections.forEach(connection => {
//             connections.push(connection.split(","))
//         });

//         this.render_lines(svg, connections)
//         this.render_nodes(svg)        
//     }


//     render_lines(svg:any, connections:string[][]){
//         /**
//          * Render each of the connections (our connections are given by the set of all unique
//          * paths, which we compute in the render phase)
//          */
//         connections.forEach(connection => {
//             const pts = [
//                 {x: this.node_to_location[connection[0]].x + this.coords.x,
//                 y: this.node_to_location[connection[0]].y + this.coords.y},
//                 {x: this.node_to_location[connection[1]].x + this.coords.x,
//                 y: this.node_to_location[connection[1]].y + this.coords.y},
//             ]
//             const connectionLine = new Line({points: pts})
//             connectionLine.render(svg)
//         })
//     }



//     render_nodes(svg:any){
//         /**
//          * Iterate over each of our nodes, rendering each as a circle using the node_to_location dict
//          */
//         this.nodes.forEach(node => {
//             const nodeCircle = new Circle({radius: this.node_radius, center: {
//                 x:0,
//                 y:0
//             }, color: "red"})
//             const circleLabel = new TextBox(node.name,{x:0,y:0},"black",this.node_radius/2)
//             const conj = new ConjoinedObject([nodeCircle,circleLabel])
//             conj.setCenter({x:this.node_to_location[node.name].x + this.coords.x, y:this.node_to_location[node.name].y+this.coords.y})
//             conj.render(svg)
//         })
//     }
//     /*
//     const nodeCircle = new Circle(this.node_radius, {
//                 x:this.node_to_location[node.name].x + this.coords.x,
//                 y: this.node_to_location[node.name].y + this.coords.y
//             }, "red", undefined, 
//                 undefined, node.name)
//     */


// }