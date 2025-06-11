import { Node } from 'webcola';
import * as dagre from 'dagre';
import { InstanceLayout, LayoutNode, LayoutEdge, LayoutConstraint, LayoutGroup, LeftConstraint, TopConstraint, AlignmentConstraint, isLeftConstraint, isTopConstraint, isAlignmentConstraint } from '../layout/interfaces';
import { LayoutInstance } from '../layout/layoutinstance';
import isEqual from 'lodash.isequal';




type NodeWithMetadata = Node & 
  { id: string, 
    attributes: Record<string, string[]>, 
    color: string 
    icon: string,
    mostSpecificType: string,
    showLabels: boolean,
  };


type EdgeWithMetadata = {
  source: number,
  target: number,
  relName: string, // This is the name of the relation for the edge
  id: string, // Unique identifier for the edge
  label: string // This is what is displayed on the edge
};

export { NodeWithMetadata, EdgeWithMetadata };

export class WebColaLayout {

  private instanceLayout: InstanceLayout;
  readonly colaConstraints: any[];
  readonly colaNodes: NodeWithMetadata[];
  readonly colaEdges: EdgeWithMetadata[];
  readonly groupDefinitions: any;

  private readonly DEFAULT_X: number;
  private readonly DEFAULT_Y: number;

  private dagre_graph : any;

  readonly FIG_WIDTH: number;
  readonly FIG_HEIGHT: number;

  constructor(instanceLayout: InstanceLayout, fig_height: number = 800, fig_width: number = 800) {

    this.FIG_HEIGHT = fig_height;
    this.FIG_WIDTH = fig_width;
    
    this.DEFAULT_X = fig_width / 2;
    this.DEFAULT_Y = fig_height / 2;

    this.instanceLayout = instanceLayout;


    // Can I create a DAGRE graph here.
    try {
      const g = new dagre.graphlib.Graph({ multigraph: true });
      g.setGraph({ nodesep: 50, ranksep: 100, rankdir: 'TB' });
      g.setDefaultEdgeLabel(() => ({}));
  
      instanceLayout.nodes.forEach(node => {
        g.setNode(node.id, { width: node.width, height: node.height });
      });
  
      instanceLayout.edges.forEach(edge => {
        g.setEdge(edge.source.id, edge.target.id);
      });
      dagre.layout(g);

      this.dagre_graph = g;
    }
    catch (e) {
      console.log(e);
      this.dagre_graph = null;
    }




    this.colaNodes = instanceLayout.nodes.map(node => this.toColaNode(node));
    this.colaEdges = instanceLayout.edges.map(edge => this.toColaEdge(edge));


    this.groupDefinitions = this.determineGroups(instanceLayout.groups);


    this.colaConstraints = this.layoutConstraintsToColaConstraints(instanceLayout.constraints);

    //// IF THERE ARE NO CONSTRAINTS, THEN FIX THE NODES TO WHATEVER
    // STERLING / DAGRE GIVES US. OTHERWISE JUST USE THOSE
    // AS SUGGESTED STARTING POINTS
    if (this.colaConstraints.length === 0 && this.dagre_graph) {
      this.colaNodes.forEach(node => node.fixed = 1);
    }


  }


  private getNodeIndex(nodeId: string) {
    return this.colaNodes.findIndex(node => node.id === nodeId);
  }



  private leftConstraint(leftNode: number, rightNode: number, sep: number) {
    // Define a separation constraint to place node A to the left of node B




    const separationConstraint = {
      type: "separation",
      axis: 'x',
      left: leftNode,
      right: rightNode,
      gap: sep,
    };
    return separationConstraint;
  }


  private topConstraint(topNode: number, bottomNode: number, sep: number) {
    // Define a separation constraint to place node A above node B
    const separationConstraint = {
      type: "separation",
      axis: 'y',
      left: topNode,
      right: bottomNode,
      gap: sep,
    };
    return separationConstraint;
  }

  private heirarchyConstraint(parentNodeIndex: number, childNodeIndex: number, sep: number) {

    const heirarchyConstraint = {
      type: 'hierarchy',
      parent: parentNodeIndex,
      child: childNodeIndex,
      gap: sep,
    };
    return heirarchyConstraint;
  }




  private toColaNode(node: LayoutNode): NodeWithMetadata {

    let x = this.DEFAULT_X;
    let y = this.DEFAULT_Y;

    let fixed = 0;

    if (this.dagre_graph) {
      // Get the corresponding node in the DAGRE graph
      let dagre_node = this.dagre_graph.node(node.id);
      x = dagre_node.x;
      y = dagre_node.y;
      //fixed = 1; // THIS REALLY IS NOT GOOD!
    }


    return {
      id: node.id,
      color: node.color,
      attributes: node.attributes,
      width: node.width,
      height: node.height,
      x: x,
      y: y,
      icon: node.icon,
      fixed: fixed,
      mostSpecificType: node.mostSpecificType,
      showLabels: node.showLabels,
    }
  }

  private toColaEdge(edge: LayoutEdge): EdgeWithMetadata {

    let sourceIndex = this.getNodeIndex(edge.source.id);
    let targetIndex = this.getNodeIndex(edge.target.id);



    return {
      source: sourceIndex,
      target: targetIndex,
      relName: edge.relationName,
      id: edge.id,
      label: edge.label
    }
  }


  private toColaConstraint(constraint: LayoutConstraint): any {

    // Switch on the type of constraint
    if (isLeftConstraint(constraint)) {
      
      // Get the two nodes that are being constrained
      let node1 = this.colaNodes[this.getNodeIndex(constraint.left.id)];
      let node2 = this.colaNodes[this.getNodeIndex(constraint.right.id)];
      //      // Set fixed to 0 here.
      node1.fixed = 0;
      node2.fixed = 0;  

      let distance = constraint.minDistance + (node1.width / 2) + (node2.width / 2);
      
      return this.leftConstraint(this.getNodeIndex(constraint.left.id), this.getNodeIndex(constraint.right.id), distance);
    }

    if (isTopConstraint(constraint)) {


      // Get the two nodes that are being constrained
      let node1 = this.colaNodes[this.getNodeIndex(constraint.top.id)];
      let node2 = this.colaNodes[this.getNodeIndex(constraint.bottom.id)];
      //      // Set fixed to 0 here.
      node1.fixed = 0;
      node2.fixed = 0;
      let distance = constraint.minDistance + (node1.height / 2) + (node2.height / 2);


      return this.topConstraint(this.getNodeIndex(constraint.top.id), this.getNodeIndex(constraint.bottom.id), distance);
    }

    if (isAlignmentConstraint(constraint)) {
       // Deprecated, we should not get here!
      throw new Error("Alignment constraints are now dealt with en-masse.");

     

      // let gap = Math.floor(Math.random() * 2); // a random number between 0 and 1
      // // This is a hack to potentially ameliorate cola stability issues
      // // causing nodes to be placed on top of each other.


      // // Is this right or do I have to switch axes. Check.
      // const alignmentConstraint = {
      //   type: "separation",
      //   axis: constraint.axis,
      //   left: this.getNodeIndex(constraint.node1.id),
      //   right: this.getNodeIndex(constraint.node2.id),
      //   gap: 0, 
      //   'equality': true
      // }
      
      // // FInd the two cola nodes that are being aligned
      // let node1 = this.colaNodes[this.getNodeIndex(constraint.node1.id)];
      // let node2 = this.colaNodes[this.getNodeIndex(constraint.node2.id)];
      // //      // Set fixed to 0 here.
      // node1.fixed = 0;
      // node2.fixed = 0;
      
      // return alignmentConstraint;

    }
    throw new Error("Constraint type not recognized");
  }


  private layoutConstraintsToColaConstraints(constraints: LayoutConstraint[]): any[] {
    type Axis = 'x' | 'y';
    // 1. Collect all node IDs
    const allNodeIds = new Set<string>();
    constraints.forEach(c => {
        if (isAlignmentConstraint(c)) {
            allNodeIds.add(c.node1.id);
            allNodeIds.add(c.node2.id);
        } else if (isLeftConstraint(c)) {
            allNodeIds.add(c.left.id);
            allNodeIds.add(c.right.id);
        } else if (isTopConstraint(c)) {
            allNodeIds.add(c.top.id);
            allNodeIds.add(c.bottom.id);
        }
    });

    // 2. Union-find for each axis
    const uf: Record<Axis, Record<string, string>> = { x: {}, y: {} };
    (['x', 'y'] as Axis[]).forEach(axis => {
        allNodeIds.forEach(id => { uf[axis][id] = id; });
    });

    function find(axis: Axis, x: string): string {
        if (uf[axis][x] !== x) uf[axis][x] = find(axis, uf[axis][x]);
        return uf[axis][x];
    }
    function union(axis: Axis, x: string, y: string) {
        uf[axis][find(axis, x)] = find(axis, y);
    }

    // 3. Union aligned nodes
    constraints.forEach(c => {
        if (isAlignmentConstraint(c)) {
            const axis = c.axis as Axis;
            union(axis, c.node1.id, c.node2.id);
        }
    });

    // 4. Build alignment groups (equivalence classes)
    const alignmentGroups: Record<Axis, Record<string, Set<string>>> = { x: {}, y: {} };
    (['x', 'y'] as Axis[]).forEach(axis => {
        allNodeIds.forEach(id => {
            const root = find(axis, id);
            if (!alignmentGroups[axis][root]) alignmentGroups[axis][root] = new Set();
            alignmentGroups[axis][root].add(id);
        });
    });

    // Helper to order nodes in an alignment group
    function orderAlignmentGroup(
        nodeSet: Set<string>,
        constraints: LayoutConstraint[],
        axis: Axis
    ): string[] {
        // Build adjacency list for the relevant axis
        const adj = new Map<string, Set<string>>();
        nodeSet.forEach(id => adj.set(id, new Set()));

        if (axis === 'y') {
            // Use left constraints for left-to-right order
            constraints.forEach(c => {
                if (isLeftConstraint(c) && nodeSet.has(c.left.id) && nodeSet.has(c.right.id)) {
                    adj.get(c.left.id)!.add(c.right.id);
                }
            });
        } else if (axis === 'x') {
            // Use top constraints for top-to-bottom order
            constraints.forEach(c => {
                if (isTopConstraint(c) && nodeSet.has(c.top.id) && nodeSet.has(c.bottom.id)) {
                    adj.get(c.top.id)!.add(c.bottom.id);
                }
            });
        }

        // Kahn's algorithm for topological sort
        const inDegree = new Map<string, number>();
        nodeSet.forEach(id => inDegree.set(id, 0));
        adj.forEach((neighbors, id) => {
            neighbors.forEach(n => inDegree.set(n, (inDegree.get(n) || 0) + 1));
        });

        const queue = Array.from(nodeSet).filter(id => inDegree.get(id) === 0);
        const result: string[] = [];
        while (queue.length) {
            const node = queue.shift()!;
            result.push(node);
            adj.get(node)!.forEach(neighbor => {
                inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
                if (inDegree.get(neighbor) === 0) queue.push(neighbor);
            });
        }
        // If cycle or incomplete, fallback to original order
        if (result.length !== nodeSet.size) return Array.from(nodeSet);

        // Ascending along x (left-to-right): leave as is for axis 'y'
        // Descending along y (top-to-bottom): reverse for axis 'x'
        if (axis === 'x') {
            return result.reverse();
        }
        return result;
    }

    // 5. Build cola alignment constraints (ORDERED)
    const colaAlignments: any[] = [];
    (['x', 'y'] as Axis[]).forEach(axis => {
        Object.values(alignmentGroups[axis]).forEach(nodeSet => {
            if (nodeSet.size > 1) {
                const ordered = orderAlignmentGroup(nodeSet, constraints, axis);
                colaAlignments.push({
                    type: "alignment",
                    axis,
                    offsets: ordered.map(nodeId => ({
                        node: this.getNodeIndex(nodeId),
                        offset: 0
                    }))
                });
                // Optional: Debug print
                console.log(`Ordered alignment group on ${axis}:`, ordered);
            }
        });
    });

    // 6. Filter out separation constraints between nodes in the same alignment group (on that axis)
    function inSameAlignmentGroup(axis: Axis, id1: string, id2: string): boolean {
        return find(axis, id1) === find(axis, id2);
    }


    // TODO: THis is CLOSER< BUT NOT QUITE!!!!
    // DO WE FILTER THESE OUT??
    // THE BUG MAY BE HERE!!!
    const colaOthers = constraints
        .filter(c => {
            if (isLeftConstraint(c)) {
                return !inSameAlignmentGroup('x', c.left.id, c.right.id);
            }
            if (isTopConstraint(c)) {
                return !inSameAlignmentGroup('y', c.top.id, c.bottom.id);
            }
            return !isAlignmentConstraint(c);
        })
        .map(c => this.toColaConstraint(c));

    return [...colaAlignments, ...colaOthers];
}


  private determineGroups(groups: LayoutGroup[]): { leaves: number[], padding: number, name: string, groups: number[] }[] {


      // Do we actually have to do this? Can we just use the groups as they are?

      // No we actually have to break this down into subgroups


      let groupsAsRecord: Record<string, string[]> = {};
      groups.forEach(group => {
        groupsAsRecord[group.name] = group.nodeIds;
      });

      let groupsAndSubgroups = this.determineGroupsAndSubgroups(groupsAsRecord);

      groupsAndSubgroups.forEach((group) => {


        let grp: LayoutGroup = groups.find(g => g.name === group.name);
        let keyNode = grp.keyNodeId;
        let keyIndex = this.getNodeIndex(keyNode);
        group['keyNode'] = keyIndex;
        group['id'] = grp.name;
        group['showLabel'] = grp.showLabel;
      });

      return groupsAndSubgroups;

    }


    // Returns true if group1 is a subgroup of group2
    private isSubGroup(group1: string[], group2: string[]) {
    return group1.every((node) => group2.includes(node));
  }



  private determineGroupsAndSubgroups(groupDefinitions: Record<string, string[]>) {
    let subgroups: Record<string, string[]> = {};


    Object.entries(groupDefinitions).forEach(([key1, value1]) => {
      Object.entries(groupDefinitions).forEach(([key2, value2]) => {

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

    const colaGroupsBeforeSubgrouping = Object.entries(groupDefinitions).map(([key, value]) => {


      const defaultPadding = 10;
      const disconnectedNodePadding = 30;
      const disconnectedNodeMarker = LayoutInstance.DISCONNECTED_PREFIX;

      let leaves = value.map((nodeId) => this.getNodeIndex(nodeId));  
      let name = key;

      let padding = name.startsWith(disconnectedNodeMarker) ? disconnectedNodePadding : defaultPadding;

      return { leaves, padding, name };
    });

    const colaGroups = Object.entries(colaGroupsBeforeSubgrouping).map(([key, value]) => {

      let leaves = value.leaves;
      let padding = value.padding;
      let name = value.name;


      // if the group has no subgroups, return it as is
      if (!subgroups[name]) {
        return { leaves, padding, name, groups: [] };
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
}
