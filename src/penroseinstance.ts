import { AlloyInstance, AlloyType, AlloyRelation } from "./alloy-instance";
import { STYLE_TEMPLATE, SUBSTANCE_TEMPLATE, DOMAIN_TEMPLATE } from "./penrosetemplates";

import { LayoutInstance } from "./layoutinstance";
import { isBuiltin } from "./alloy-instance/src/type";

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
    private readonly SKIP_BUILTIN = true;

    private readonly _defined_types: Record<string, AlloyType>;
    private readonly _defined_relations: Record<string, AlloyRelation>;

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
        interface TypeElement {
            type: string;
            supertype: string;
        }
        ///// HACK //////

        function hasSuperType(te: TypeElement) {
            return te.supertype != "_Vertex" && te.supertype != "_Cluster";
        }

        function sortTypes(elements: TypeElement[]): TypeElement[] {
            const elementLookup = new Map<string, TypeElement>();
            elements.forEach(element => elementLookup.set(element.type, element));

            const sorted: TypeElement[] = [];
            const visited = new Set<string>();

            function visit(element: TypeElement) {
                if (visited.has(element.type)) return;
                visited.add(element.type);

                if (hasSuperType(element)) {
                    const supertypeElement = elementLookup.get(element.supertype);
                    if (supertypeElement) {
                        visit(supertypeElement); // Visit the supertype first
                    }
                }

                sorted.push(element);
            }

            elements.forEach(element => {
                visit(element);
            });

            return sorted;
        }
        ///////////

        let type_defs: TypeElement[] = Object.entries(this._defined_types)
            .filter(([type, type_data]) => !(isBuiltin(type_data) && this.SKIP_BUILTIN))
            .map(([type, type_data]) => {

                let type_id = this.cleanType(type_data.id);
                // This is heirarchy of the type, and I believe it is ordered (with the 0th element being the type itself)
                let type_heirarchy = type_data.types;

                // If type_heirarchy[1] exists, that is the supertype else, it is _Vertex OR _Cluster
                let supertype = this.cleanType(type_heirarchy[1]) || "_Vertex";

                //// TODO: Unless supertype is _Cluster, which would be the case depending on the annotations!

                /*

                    May have to do some post-editing about the cluster maybe? Like, relations whose atoms are involved with clusters shouldn't plot the atoms? idk

                */

                let x: TypeElement = { type: type_id, supertype: supertype };
                return x;
            });


        /// We now have a list of types and super types. How can we order them so the super types are declared first?
        let type_defs_sorted = sortTypes(type_defs);
        let type_defs_str = type_defs_sorted.map((x) => `type ${x.type} <: ${x.supertype}`).join("\n");


        let relation_defs = Object.entries(this._defined_relations)
            .map(([rel, rel_data]) => {

                let pname = rel_data.name.replace("<:", "_");
                let args = rel_data.types.map((t) => {

                    let t_cleaned = this.cleanType(t);
                    return `${t_cleaned} ${this.randId()}`;
                }).join(", ");
                return `predicate ${pname}(${args})`;
            });
        let relation_defs_str = relation_defs.join("\n");



        return [DOMAIN_TEMPLATE, type_defs_str, relation_defs_str].join("\n");

    }

    generateSubstance(): string {
        // TODO: We have to handle skolems as well

        // Each atom of each type becomes a domain object
        let domain_objects = Object.entries(this._defined_types)
            .map(([type, type_data]) => {

                // TODO: Hack
                if (isBuiltin(type_data) && this.SKIP_BUILTIN) {
                    return "";
                }

                let type_id = this.cleanType(type_data.id);
                let atoms = type_data.atoms;

                if (atoms.length == 0) {
                    return "";
                }

                let atom_ids = atoms.map((atom) => {
                    return this.ensureValidId(atom.id);
                });
                let atom_str = atom_ids.join(", ");
                return `${type_id} ${atom_str}
                    AutoLabel ${atom_str}`;


            });
        let domain_objects_str = domain_objects.join("\n");

        let relationEntries = Object.entries(this._defined_relations);
        if (relationEntries == undefined || relationEntries.length == 0) {
            return [SUBSTANCE_TEMPLATE, domain_objects_str].join("\n");
        }



        let clusters : Record<string, Record<string, string[]>> = {};

        relationEntries
        .filter(([rel, rel_data]) => {

            if (!rel_data) {
                return false;
            }

            let fieldName = rel_data.name.replace("<:", "_");
            return this._layoutInstance.shouldClusterOnField(fieldName);
        })
        .forEach(([rel, rel_data]) => {

            let fieldName = rel_data.name.replace("<:", "_");

            let clusterForRelation : Record<string, string[]> = {};

            let tuples = rel_data.tuples;
            tuples.forEach((tuple) => {
                let atoms = tuple.atoms.map((atom) => this.ensureValidId(atom));
                let clusterName = this.getClusterName(atoms);
                let clusterTarget = this.ensureValidId(atoms[0]);

                // If clusterName is not in clusters.keys, then we need to create a new cluster
                if (!(clusterName in clusterForRelation)) {
                    clusterForRelation[clusterName] = [];
                }
                clusterForRelation[clusterName].push(clusterTarget);
            });
            clusters[fieldName] = clusterForRelation;
        });

        // Now we have all the clusters, we can add them to the domain objects
        let cluster_objects = Object.entries(clusters).map(([fieldName, clusterData]) => {

            let prefix = `-- Clusters for ${fieldName} --\n`;
            let allAtoms = new Set<string>();
            // Create a set of all atoms in a cluster for a field
            let allFieldClusters = Object.values(clusterData).forEach((clusterTargets) => {
               clusterTargets.forEach((atom) => {
                   allAtoms.add(atom);
               });
            });



            let inClusterObjects = Object.entries(clusterData).map(([clusterName, clusterTargets]) => {
                
                let clusterDef = `Cluster ${clusterName}\n`;
                let clusterAtoms = clusterTargets.map((atom) => {
                    return `_layoutInCluster( clusterName  ,  ${atom})`;
                }).join("\n");
                return clusterDef + clusterAtoms;
            });

            // But we also need to define all the values that are NOT in a cluster
            let notInClusterObjects = Object.entries(clusterData).map(([clusterName, clusterTargets]) => {
                let clusterAtoms = new Set(clusterTargets);
                // Get all the strings that are in allAtoms but not in clusterAtoms
                let notInClusterAtoms = Array.from(allAtoms).filter((atom) => !clusterAtoms.has(atom));
                let clusterAtomConstraints = notInClusterAtoms.map((atom) => {
                    return `_layoutNotInCluster(${clusterName}, ${atom})`;
                }).join("\n");
            });

            return prefix + inClusterObjects.join("\n") + notInClusterObjects.join("\n");
          });

          let clusterString = cluster_objects.join("\n");







        // Each tuple of each relation becomes a Link object, with a label
        let relation_objects = relationEntries
        // Don't draw edges for relations that are defined as clusters
        .filter(([rel, rel_data]) => {
            let fieldName = rel_data.name.replace("<:", "_");
            return !this._layoutInstance.shouldClusterOnField(fieldName);
        })
        .map(([rel, rel_data]) => {


            if (!rel_data) {
                return "";
            }

            let relationname = rel_data.name.replace("<:", "_");
            let layoutConstraints = this._layoutInstance.getFieldLayout(relationname)
            let tuples = rel_data.tuples;
            let relationConstraints = tuples.map((tuple) => {

                let randomLinkName = this.randId(6);

                let atoms = tuple.atoms.map((atom) => this.ensureValidId(atom));
                let atom_str = atoms.join(", ");
                let linkDef = `_Link ${randomLinkName} := _Arc(${atom_str}) \n
            Label ${randomLinkName}  "${relationname}"\n
            `;

                let layoutDef = layoutConstraints.map((constraintName) => {
                    return `${constraintName}(${atom_str})`;
                }).join("\n");
                return linkDef + layoutDef;
            });
            return relationConstraints.join("\n");
        });

        let relation_objects_str = relation_objects.join("\n");
        let sub = SUBSTANCE_TEMPLATE;
        return [sub, domain_objects_str, clusterString, relation_objects_str].join("\n");
    }

    generateStyle(): string {
        // TODO: This will have to become more sophisticated.
        let style = STYLE_TEMPLATE;
        return style;
    }


    private cleanType(t: string): string {
        if (!t) {
            return "";
        }
        return t.replace("/", "_");
    }

    private ensureValidId(id: string): string {
        if (!id) {
            return "";
        }
        return id.replace("$", "_").replace("/", "_").replace("-", "_neg_");
    }

    private getClusterName(atoms : string[]) : string {

        if (atoms.length < 2) {
            // We can't cluster a single atom
            return "";
        }

        let pertinentAtoms = atoms.slice(1).map((atom) => this.ensureValidId(atom));
        let clusterName = pertinentAtoms.join("->");
        return clusterName;

    }
}