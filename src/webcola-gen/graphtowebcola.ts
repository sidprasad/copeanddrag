import { Graph } from 'graphlib';
import * as cola from 'webcola'; // Importing WebCola
import { Group, Node, Link } from 'webcola';
import { LayoutInstance } from '../layoutinstance';


const nodeWidth = 50;
const nodeHeight = 30;

const graphWidth = 800;
const graphHeight = 800;

const minSepHeight = 15;
const minSepWidth = 15;
const minSeparation = Math.min(minSepHeight, minSepWidth);


const DEFAULT_X = 0;
const DEFAULT_Y = 0;




type NodeWithId = Node & { id: string, attributes: Record<string, string[]> };

export function graphToWebcola(graph: Graph, layoutSpec: LayoutInstance) {

  // This must happen before the nodes are generated,
  // because the function generateGroups may remove groups and nodes
  // from the graph.
  const allGraphAttributes = layoutSpec.generateAttributes(graph);
  const groupDefinitions = layoutSpec.generateGroups(graph);


  const colaNodes: NodeWithId[] = graph.nodes().map(node => {

    const attributes = allGraphAttributes[node] || {};


    const h = nodeHeight + minSepHeight;
    const w = nodeWidth + minSepWidth;
    return { id: node, x: DEFAULT_X, y: DEFAULT_Y, width: w, height: h, attributes: attributes };
  });

  function getNodeIndex(nodeId: string) {
    return colaNodes.findIndex(node => node.id === nodeId);
  }


  // Non-group alignment constraints
  let colaConstraints: any[] = [];

  const colaEdges = graph.edges().map(edge => {
    const edgeId = edge.name;

    // Get the Edge label
    const relName = graph.edge(edge.v, edge.w, edgeId);
    const sourceNode = getNodeIndex(edge.v);
    const targetNode = getNodeIndex(edge.w);

    colaConstraints.push(heirarchyConstraint(sourceNode, targetNode, minSeparation));

    layoutSpec.getFieldLayout(relName).forEach((direction) => {
      if (direction === "left") {
        // Target node goes to the left of source node
        colaConstraints.push(leftConstraint(targetNode, sourceNode, minSepWidth));
      } else if (direction === "right") {
        // Source node goes to the left of target node
        colaConstraints.push(leftConstraint(sourceNode, targetNode, minSepWidth));
      }
      else if (direction === "above") {
        // Target node goes above source node
        colaConstraints.push(topConstraint(targetNode, sourceNode, minSepHeight));
      } else if (direction === "below") {
        // Source node goes above target node
        colaConstraints.push(topConstraint(sourceNode, targetNode, minSepHeight));
      }
    });
    return {
      source: sourceNode,
      target: targetNode,
      id: edgeId,
      relName: relName
    };
  });



  //Now modify groupDefinitions to be in the format that WebCola expects (ie indexed by node)

  // Hack: for now, lets not think about subgroups 
  const colaGroups = Object.entries(groupDefinitions).map(([key, value]) => {

    let leaves = value.map((nodeId) => getNodeIndex(nodeId));
    let padding = 20;
    let name = key;
    return { leaves, padding, name };
  });




  return { colaNodes, colaEdges, colaConstraints, colaGroups };
}

function leftConstraint(leftNode: number, rightNode: number, sep: number) {
  // Define a separation constraint to place node A to the left of node B
  const separationConstraint = {
    axis: 'x',
    left: leftNode,
    right: rightNode,
    gap: sep,
  };
  return separationConstraint;
}


function topConstraint(topNode: number, bottomNode: number, sep: number) {
  // Define a separation constraint to place node A above node B
  const separationConstraint = {
    axis: 'y',
    left: topNode,
    right: bottomNode,
    gap: sep,
  };
  return separationConstraint;
}

function heirarchyConstraint(parentNodeIndex: number, childNodeIndex: number, sep: number) {

  const heirarchyConstraint = {
    type: 'hierarchy',
    parent: parentNodeIndex,
    child: childNodeIndex,
    gap: sep,
  };
  return heirarchyConstraint;
}



