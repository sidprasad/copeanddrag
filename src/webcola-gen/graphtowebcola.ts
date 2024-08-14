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





type NodeWithMetadata = Node & { id: string, attributes: Record<string, string[]>, color: string };
export {NodeWithMetadata};

export class WebColaLayout {
  private graph: Graph;
  private layoutInstance: LayoutInstance;
  private alloyInstance: AlloyInstance;

  private groupDefinitions: Record<string, string[]>;
  private allGraphAttributes: Record<string, Record<string, string[]>>;
  private nodeColors: Record<string, string>;

  private colaConstraints: any[];

  private colaNodes: NodeWithMetadata[];

  private readonly DEFAULT_X : number;
  private readonly DEFAULT_Y : number;

  readonly FIG_WIDTH : number;
  readonly FIG_HEIGHT : number;

  constructor(graph: Graph, layoutInstance: LayoutInstance, alloyInstance: AlloyInstance, fig_height : number = 800, fig_width : number = 800) {


    this.FIG_HEIGHT = fig_height;
    this.FIG_WIDTH = fig_width;
    this.DEFAULT_X = fig_width / 2;
    this.DEFAULT_Y = fig_height / 2;


    this.graph = graph;
    this.layoutInstance = layoutInstance;
    this.alloyInstance = alloyInstance;


    const changes = layoutInstance.applyGraphChangesRequiredByLayout(this.graph, this.alloyInstance);

    this.groupDefinitions = changes.groups;
    this.allGraphAttributes = changes.attributes;
    this.nodeColors = changes.colors;

    this.colaConstraints = [];

    this.colaNodes = this.graph.nodes().map(node => {

      const attributes = this.allGraphAttributes[node] || {};
      const color = this.nodeColors[node] || "white";

      const h = nodeHeight + minSepHeight;
      const w = nodeWidth + minSepWidth;
      return { id: node, x: this.DEFAULT_X, y: this.DEFAULT_Y, width: w, height: h, attributes: attributes, color: color };
    });
  }


  getNodeIndex(nodeId: string) {
    return this.colaNodes.findIndex(node => node.id === nodeId);
  }

  // Returns true if group1 is a subgroup of group2
  isSubGroup(group1: string[], group2: string[]) {
    return group1.every((node) => group2.includes(node));
  }

  // Helper function to find the intersection of two arrays
  intersect(array1: string[], array2: string[]): string[] {
    return array1.filter(value => array2.includes(value));
  }

  layout() {


    this.applyClosureConstraints();
    const colaEdges = this.setupRelationalConstraints();
    const colaGroups = this.determineGroupsAndSubgroups();


    return {

      colaNodes: this.colaNodes,
      colaEdges: colaEdges,
      colaConstraints: this.colaConstraints,
      colaGroups: colaGroups
    }
  }


  private setupRelationalConstraints() {

    return this.graph.edges().map(edge => {
      const edgeId = edge.name;

      // Get the Edge label
      const edgeLabel = this.graph.edge(edge.v, edge.w, edgeId);
      const sourceNode = this.getNodeIndex(edge.v);

      const relName = this.layoutInstance.getRelationName(this.graph, edge);
      const targetNode = this.getNodeIndex(edge.w);

      //colaConstraints.push(heirarchyConstraint(sourceNode, targetNode, minSeparation));

      this.layoutInstance.getFieldLayout(relName).forEach((direction) => {
        if (direction === "left") {
          // Target node goes to the left of source node
          this.colaConstraints.push(this.leftConstraint(targetNode, sourceNode, minSepWidth));
        } else if (direction === "right") {
          // Source node goes to the left of target node
          this.colaConstraints.push(this.leftConstraint(sourceNode, targetNode, minSepWidth));
        }
        else if (direction === "above") {
          // Target node goes above source node
          this.colaConstraints.push(this.topConstraint(targetNode, sourceNode, minSepHeight));
        } else if (direction === "below") {
          // Source node goes above target node
          this.colaConstraints.push(this.topConstraint(sourceNode, targetNode, minSepHeight));
        }
      });

      return {
        source: sourceNode,
        target: targetNode,
        id: edgeId,
        relName: edgeLabel
      };
    });
  }


  private orderNodesByEdges(edges): number[] {
    let edgesIndices = edges.map(edge => {
        return { 
          v : this.getNodeIndex(edge.v),
          w : this.getNodeIndex(edge.w)
        };
    });

    let inNodes = edgesIndices.map(edge => edge.v);
    let outNodes = edgesIndices.map(edge => edge.w);

    // Root nodes have no incoming edges
    let rootNodes = outNodes.filter(node => !inNodes.includes(node));

    if (rootNodes.length === 0) {
      // If there are no root nodes, just pick any node
      rootNodes = [outNodes[0]];
    }


    let visited = new Set<number>();
    let traversalOrder = [];
    let queue : number[] = rootNodes;

    while (queue.length > 0) {
      let node = queue.pop();
      if (!visited.has(node)) {
        visited.add(node);
        traversalOrder.push(node);

        // Get all the outgoing edges from this node
        let outgoingEdges = edgesIndices.filter(edge => edge.v === node);
        let outgoingNodes = outgoingEdges.map(edge => edge.w);

        // Add the outgoing nodes to the queue
        queue = queue.concat(outgoingNodes);
      }
    }  
    return traversalOrder;
  }

  private determineGroupsAndSubgroups() {
    let subgroups: Record<string, string[]> = {};


    Object.entries(this.groupDefinitions).forEach(([key1, value1]) => {
      Object.entries(this.groupDefinitions).forEach(([key2, value2]) => {

        const avoidContainmentCycle =
          key1 !== key2 // Group is not a subgroup of itself
          && (!subgroups[key2] || !subgroups[key2].includes(key1)) // Group is not a subgroup of a subgroup of itself
        const shouldAddSubgroup = avoidContainmentCycle && this.isSubGroup(value2, value1);


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

    const colaGroupsBeforeSubgrouping = Object.entries(this.groupDefinitions).map(([key, value]) => {

      let leaves = value.map((nodeId) => this.getNodeIndex(nodeId));
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

    return colaGroups;
  }

  leftConstraint(leftNode: number, rightNode: number, sep: number) {
    // Define a separation constraint to place node A to the left of node B
    const separationConstraint = {
      axis: 'x',
      left: leftNode,
      right: rightNode,
      gap: sep,
    };
    return separationConstraint;
  }


  topConstraint(topNode: number, bottomNode: number, sep: number) {
    // Define a separation constraint to place node A above node B
    const separationConstraint = {
      axis: 'y',
      left: topNode,
      right: bottomNode,
      gap: sep,
    };
    return separationConstraint;
  }

  heirarchyConstraint(parentNodeIndex: number, childNodeIndex: number, sep: number) {

    const heirarchyConstraint = {
      type: 'hierarchy',
      parent: parentNodeIndex,
      child: childNodeIndex,
      gap: sep,
    };
    return heirarchyConstraint;
  }


  applyClosureConstraints() {

    const closures = this.layoutInstance.getClosures();
    closures.forEach((closure) => {
      this.applyClosureConstraint(closure.fieldName, closure.direction);
    });

  }



  applyClosureConstraint(relName: string, direction: string) {


    let direction_mult : number = 0;
    
    if (direction === "clockwise") {
      direction_mult = 1;
    }
    else if (direction === "counterclockwise") {
      direction_mult = -1;
    }

    const c: NodeWithMetadata = {
      id: `_${relName}`,
      x: this.DEFAULT_X,
      y: this.DEFAULT_Y,
      width: 2,
      height: 2,
      attributes: {},
      color: "transparent"
    };

    this.colaNodes.push(c);
    let c_index = this.getNodeIndex(c.id);


    // Now get all nodes that have the relation relName

    let relationEdges = this.graph.edges().filter(edge => {
      return this.layoutInstance.getRelationName(this.graph, edge) === relName;
    });

    if (relationEdges.length === 0) {
      return;
    }

    let relatedNodes = this.orderNodesByEdges(relationEdges);

    // Now keep the related nodes a fixed distance from c
    const fixedDistance = 30; // Example fixed distance
    const angleStep = (direction_mult * 2 * Math.PI) / relatedNodes.length;


    let index = 0;
    relatedNodes.forEach(nodeIndex => {

      const angle = index * angleStep;

      const x_gap = fixedDistance * Math.cos(angle);
      const y_gap = fixedDistance * Math.sin(angle);


      if (x_gap > 0) {
        this.colaConstraints.push(this.leftConstraint(c_index, nodeIndex, x_gap));
      }
      else {
        this.colaConstraints.push(this.leftConstraint(nodeIndex, c_index, -x_gap));
      }

      if (y_gap > 0) {
        this.colaConstraints.push(this.topConstraint(c_index, nodeIndex, y_gap));
      }
      else {
        this.colaConstraints.push(this.topConstraint(nodeIndex, c_index, -y_gap));
      }
      index++;
    });
  }
}
