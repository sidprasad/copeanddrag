import { AlloyInstance, AlloyType, AlloyRelation } from "./alloy-instance";
import { STYLE_TEMPLATE, SUBSTANCE_TEMPLATE, DOMAIN_TEMPLATE } from "./penrosetemplates";

import {LayoutInstance} from "./layoutinstance";

        /*
{
  types: {
    "seq/Int": {
      _: "type",
      id: "seq/Int",
      types: [
        "seq/Int",
        "Int",
      ],
      atoms: [
      ],
      meta: {
        builtin: true,
      },
    },
    Int: {
      _: "type",
      id: "Int",
      types: [
        "Int",
      ],
      atoms: [
        {
          _: "atom",
          id: "-8",
          type: "Int",
        },
        {
          _: "atom",
          id: "-7",
          type: "Int",
        },
        {
          _: "atom",
          id: "-6",
          type: "Int",
        },
        {
          _: "atom",
          id: "-5",
          type: "Int",
        },
        {
          _: "atom",
          id: "-4",
          type: "Int",
        },
        {
          _: "atom",
          id: "-3",
          type: "Int",
        },
        {
          _: "atom",
          id: "-2",
          type: "Int",
        },
        {
          _: "atom",
          id: "-1",
          type: "Int",
        },
        {
          _: "atom",
          id: "0",
          type: "Int",
        },
        {
          _: "atom",
          id: "1",
          type: "Int",
        },
        {
          _: "atom",
          id: "2",
          type: "Int",
        },
        {
          _: "atom",
          id: "3",
          type: "Int",
        },
        {
          _: "atom",
          id: "4",
          type: "Int",
        },
        {
          _: "atom",
          id: "5",
          type: "Int",
        },
        {
          _: "atom",
          id: "6",
          type: "Int",
        },
        {
          _: "atom",
          id: "7",
          type: "Int",
        },
      ],
      meta: {
        builtin: true,
      },
    },
    String: {
      _: "type",
      id: "String",
      types: [
        "String",
      ],
      atoms: [
      ],
      meta: {
        builtin: true,
      },
    },
    "this/Leaf": {
      _: "type",
      id: "this/Leaf",
      types: [
        "this/Leaf",
        "this/Node",
      ],
      atoms: [
        {
          _: "atom",
          id: "Leaf$0",
          type: "this/Leaf",
        },
        {
          _: "atom",
          id: "Leaf$1",
          type: "this/Leaf",
        },
        {
          _: "atom",
          id: "Leaf$2",
          type: "this/Leaf",
        },
        {
          _: "atom",
          id: "Leaf$3",
          type: "this/Leaf",
        },
        {
          _: "atom",
          id: "Leaf$4",
          type: "this/Leaf",
        },
      ],
      meta: undefined,
    },
    "this/Branch": {
      _: "type",
      id: "this/Branch",
      types: [
        "this/Branch",
        "this/Node",
      ],
      atoms: [
        {
          _: "atom",
          id: "Branch$0",
          type: "this/Branch",
        },
        {
          _: "atom",
          id: "Branch$1",
          type: "this/Branch",
        },
        {
          _: "atom",
          id: "Branch$2",
          type: "this/Branch",
        },
        {
          _: "atom",
          id: "Branch$3",
          type: "this/Branch",
        },
      ],
      meta: undefined,
    },
    "this/Node": {
      _: "type",
      id: "this/Node",
      types: [
        "this/Node",
      ],
      atoms: [
      ],
      meta: {
        abstract: true,
      },
    },
    univ: {
      _: "type",
      id: "univ",
      types: [
      ],
      atoms: [
      ],
      meta: {
        builtin: true,
      },
    },
  },
  relations: {
    "this/Branch<:left": {
      _: "relation",
      id: "this/Branch<:left",
      name: "left",
      types: [
        "this/Branch",
        "this/Node",
      ],
      tuples: [
        {
          _: "tuple",
          types: [
            "this/Branch",
            "this/Node",
          ],
          atoms: [
            "Branch$0",
            "Branch$3",
          ],
        },
        {
          _: "tuple",
          types: [
            "this/Branch",
            "this/Node",
          ],
          atoms: [
            "Branch$1",
            "Branch$2",
          ],
        },
        {
          _: "tuple",
          types: [
            "this/Branch",
            "this/Node",
          ],
          atoms: [
            "Branch$2",
            "Branch$0",
          ],
        },
        {
          _: "tuple",
          types: [
            "this/Branch",
            "this/Node",
          ],
          atoms: [
            "Branch$3",
            "Leaf$4",
          ],
        },
      ],
    },
    "this/Branch<:right": {
      _: "relation",
      id: "this/Branch<:right",
      name: "right",
      types: [
        "this/Branch",
        "this/Node",
      ],
      tuples: [
        {
          _: "tuple",
          types: [
            "this/Branch",
            "this/Node",
          ],
          atoms: [
            "Branch$0",
            "Leaf$3",
          ],
        },
        {
          _: "tuple",
          types: [
            "this/Branch",
            "this/Node",
          ],
          atoms: [
            "Branch$1",
            "Leaf$2",
          ],
        },
        {
          _: "tuple",
          types: [
            "this/Branch",
            "this/Node",
          ],
          atoms: [
            "Branch$2",
            "Leaf$1",
          ],
        },
        {
          _: "tuple",
          types: [
            "this/Branch",
            "this/Node",
          ],
          atoms: [
            "Branch$3",
            "Leaf$0",
          ],
        },
      ],
    },
  },
  skolems: {
    "this/Node<:$binaryTree_root": {
      _: "relation",
      id: "this/Node<:$binaryTree_root",
      name: "$binaryTree_root",
      types: [
        "this/Node",
      ],
      tuples: [
        {
          _: "tuple",
          types: [
            "this/Node",
          ],
          atoms: [
            "Branch$1",
          ],
        },
      ],
    },
  },
}


*/


export class PenroseInstance {

    private readonly _alloyInstance: AlloyInstance;
    private readonly _layoutInstance: LayoutInstance;

    private readonly _defined_types : Record<string, AlloyType>;
    private readonly _defined_relations : Record<string, AlloyRelation>;

    constructor(public alloyInstance: AlloyInstance, layoutInstance: LayoutInstance) {
        this._alloyInstance = alloyInstance;
        this._defined_types = this._alloyInstance.types;
        this._defined_relations = this._alloyInstance.relations;
        this._layoutInstance = layoutInstance;
    }


    private randId(length: number = 4): string {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }


    public getDomain(): string {
        return this.generateDomain();
    }

    public getSubstance(): string {
        return this.generateSubstance();
    }

    public getStyle(): string {
        return this.generateStyle();
    }



    generateDomain(): string {

        let type_defs = Object.entries(this._defined_types)
        .map(([type, type_data]) => {
            let type_id = type_data.id;
            // This is heirarchy of the type, and I believe it is ordered (with the 0th element being the type itself)
            let type_heirarchy = type_data.types;
            
            // If type_heirarchy[1] exists, that is the supertype else, it is _Vertex
            let supertype = type_heirarchy[1] || "_Vertex";

            //// TODO: Unless supertype is _Cluster, which would be the case depending on the annotations!


            return `type ${type_id} <: ${supertype}`;
        });
        let type_defs_str = type_defs.join("\n");

        let relation_defs = Object.entries(this._defined_relations)
        .map(([rel, rel_data]) => {

            let pname = rel_data.name.replace("<:", "_");
            let args = rel_data.types.map((t) => {
                return `${t} ${this.randId()}`;
            }).join(", ");
            return `predicate ${pname}(${args})`;
        });
        let relation_defs_str = relation_defs.join("\n");
        return [DOMAIN_TEMPLATE, type_defs_str, relation_defs_str].join("\n");

    }

    generateSubstance(): string {
        // TODO

        // Each atom of each type becomes a domain object
        let domain_objects = Object.entries(this._defined_types)
        .map(([type, type_data]) => {

            let type_id = type_data.id;
            let atoms = type_data.atoms;
            let atom_ids = atoms.map((atom) => {
                return atom.id;
            });
            let atom_str = atom_ids.join(", ");
            

            
            return `${type_id} = {${atom_str}}`;


        });
        let domain_objects_str = domain_objects.join("\n");




        // Each tuple of each relation becomes a Link object, with a label
        let relation_objects = Object.entries(this._defined_relations)
        .map(([rel, rel_data]) => {


            // _Link b2x := _Arc(b2, x)
            // Label b2x "left"

            let randomLinkName = this.randId(6);

            let relationname = rel_data.name.replace("<:", "_");
            let tuples = rel_data.tuples;
            let tuple_str = tuples.map((tuple) => {
                let atoms = tuple.atoms;
                let atom_str = atoms.join(", ");
                return `_Link `;
            }).join(", ");

            let layoutConstraints = this._layoutInstance.getFieldLayout(relationname)
            .map((constraintName) => {
                return `${constraintName}(${tuple_str})`;
            });
            let layoutConstraintsStr = layoutConstraints.join("\n");

            // This is where the relational data is also encoded
            /*
                // We query the layout instance for the layout of the atoms
                _layoutLeft(${tuple_str})
                _layoutAbove(${tuple_str})
            */

            return `_Link ${randomLinkName} := _Arc(${tuple_str}) \n` + layoutConstraintsStr;
        });


        let relation_objects_str = relation_objects.join("\n");
        let sub = SUBSTANCE_TEMPLATE;
        return [sub, domain_objects_str, relation_objects_str].join("\n");
    }

    generateStyle(): string {
        // TODO
        let style = STYLE_TEMPLATE;
        return style;
    }

}