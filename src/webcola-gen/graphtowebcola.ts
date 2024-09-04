import { Node } from 'webcola';
import { InstanceLayout, LayoutNode, LayoutEdge, LayoutConstraint, LayoutGroup, LeftConstraint, TopConstraint, AlignmentConstraint, isLeftConstraint, isTopConstraint, isAlignmentConstraint } from '../layout/interfaces';



const nodeWidth = 70;
const nodeHeight = 45;


type NodeWithMetadata = Node & { id: string, attributes: Record<string, string[]>, color: string };


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

  readonly FIG_WIDTH: number;
  readonly FIG_HEIGHT: number;

  constructor(instanceLayout: InstanceLayout, fig_height: number = 800, fig_width: number = 800) {


    this.FIG_HEIGHT = fig_height;
    this.FIG_WIDTH = fig_width;
    this.DEFAULT_X = fig_width / 2;
    this.DEFAULT_Y = fig_height / 2;


    this.instanceLayout = instanceLayout;

    this.colaNodes = instanceLayout.nodes.map(node => this.toColaNode(node));
    this.colaEdges = instanceLayout.edges.map(edge => this.toColaEdge(edge));


    this.groupDefinitions = this.determineGroups(instanceLayout.groups);


    this.colaConstraints = instanceLayout.constraints.map(constraint => this.toColaConstraint(constraint));


  }


  private getNodeIndex(nodeId: string) {
    return this.colaNodes.findIndex(node => node.id === nodeId);
  }



  private leftConstraint(leftNode: number, rightNode: number, sep: number) {
    // Define a separation constraint to place node A to the left of node B
    const separationConstraint = {
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

    return {
      id: node.id,
      color: node.color,
      attributes: node.attributes,
      width: nodeWidth,
      height: nodeHeight,
      x: this.DEFAULT_X,
      y: this.DEFAULT_Y
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
      return this.leftConstraint(this.getNodeIndex(constraint.left.id), this.getNodeIndex(constraint.right.id), constraint.minDistance);
    }

    if (isTopConstraint(constraint)) {
      return this.topConstraint(this.getNodeIndex(constraint.top.id), this.getNodeIndex(constraint.bottom.id), constraint.minDistance);
    }

    if (isAlignmentConstraint(constraint)) {

      // Is this right or do I have to switch axes. Check.
      const alignmentConstraint = {
        axis: constraint.axis,
        left: this.getNodeIndex(constraint.node1.id),
        right: this.getNodeIndex(constraint.node2.id),
        gap: 0,
        'equality': true
      }
      return alignmentConstraint;

    }
    throw new Error("Constraint type not recognized");
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

      let leaves = value.map((nodeId) => this.getNodeIndex(nodeId));
      let padding = 5;
      let name = key;

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
