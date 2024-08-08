import { Graph } from 'graphlib';
import * as cola from 'webcola'; // Importing WebCola
import { Group, Node, Link } from 'webcola';
import { LayoutInstance } from '../layoutinstance';
import { AlloyInstance } from '../alloy-instance';


const nodeWidth = 50;
const nodeHeight = 30;

const minSepHeight = 15;
const minSepWidth = 15;
const minSeparation = Math.min(minSepHeight, minSepWidth);


const DEFAULT_X = 0;
const DEFAULT_Y = 0;




type NodeWithMetadata = Node & { id: string, attributes: Record<string, string[]>, color: string };

export function graphToWebcola(graph: Graph, layoutInstance: LayoutInstance, alloyInstance: AlloyInstance) {

  // This must happen before the nodes are generated,
  // because the function generateGroups may remove groups and nodes
  // from the graph.
  const changes = layoutInstance.applyGraphChangesRequiredByLayout(graph, alloyInstance);

  const groupDefinitions = changes.groups;
  const allGraphAttributes = changes.attributes;
  const nodeColors = changes.colors;

  const colaNodes: NodeWithMetadata[] = graph.nodes().map(node => {

    const attributes = allGraphAttributes[node] || {};
    const color = nodeColors[node] || "white";

    const h = nodeHeight + minSepHeight;
    const w = nodeWidth + minSepWidth;
    return { id: node, x: DEFAULT_X, y: DEFAULT_Y, width: w, height: h, attributes: attributes, color: color };
  });

  function getNodeIndex(nodeId: string) {
    return colaNodes.findIndex(node => node.id === nodeId);
  }


  // Non-group alignment constraints
  let colaConstraints: any[] = [];

  const colaEdges = graph.edges().map(edge => {
    const edgeId = edge.name;

    // Get the Edge label
    const edgeLabel = graph.edge(edge.v, edge.w, edgeId);
    const sourceNode = getNodeIndex(edge.v);

    const relName = layoutInstance.getRelationName(graph, edge);//
    const targetNode = getNodeIndex(edge.w);

    //colaConstraints.push(heirarchyConstraint(sourceNode, targetNode, minSeparation));

    layoutInstance.getFieldLayout(relName).forEach((direction) => {
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
      relName: edgeLabel
    };
  });





  // Returns true if group1 is a subgroup of group2
  function isSubGroup(group1: string[], group2: string[]) {
    return group1.every((node) => group2.includes(node));
  }

  // Helper function to find the intersection of two arrays
  function intersect(array1: string[], array2: string[]): string[] {
    return array1.filter(value => array2.includes(value));
  }

  let subgroups: Record<string, string[]> = {};
  Object.entries(groupDefinitions).forEach(([key1, value1]) => {
    Object.entries(groupDefinitions).forEach(([key2, value2]) => {

      const avoidContainmentCycle = 
                                  key1 !== key2 // Group is not a subgroup of itself
                                  && (!subgroups[key2] || !subgroups[key2].includes(key1)) // Group is not a subgroup of a subgroup of itself
      const shouldAddSubgroup = avoidContainmentCycle && isSubGroup(value2, value1);


      if (shouldAddSubgroup) {

        if (subgroups[key1]) {
          subgroups[key1].push(key2);
        } else {
          subgroups[key1] = [key2];
        }
      }
    })
  });



  // TODO: But there may be groups that intersect with each other, but are not subgroups of each other.
  // WebCola struggles with this, so need to find a way to handle this.
  // Similarly, two webcola groups cannot share a subgroup.



  //Now modify groupDefinitions to be in the format that WebCola expects (ie indexed by node)

  const colaGroupsBeforeSubgrouping = Object.entries(groupDefinitions).map(([key, value]) => {

    let leaves = value.map((nodeId) => getNodeIndex(nodeId));
    let padding = 20;
    let name = key;

    return { leaves, padding, name };
  });



  const colaGroups = Object.entries(colaGroupsBeforeSubgrouping).map(([key, value]) => {

    let leaves = value.leaves;
    let padding = value.padding;
    let name = value.name;

    
    // if the group has no subgroups, return it as is
    if (!subgroups[name]) {
      return { leaves, padding, name };
    }

    let groups = subgroups[name].map((subgroupName) => {
      // Get the index of the subgroup
      let subgroupIndex = colaGroupsBeforeSubgrouping.findIndex((group) => group.name === subgroupName);
      return subgroupIndex;
    });


    // Remove leaves in the subgroups from the leaves in the group
    groups.forEach((groupIndex) => {
      let group = colaGroupsBeforeSubgrouping[groupIndex];
      leaves = leaves.filter((leaf) => !group.leaves.includes(leaf));
    });


    return { leaves, padding, name, groups };
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



