import { AlloyInstance, AlloyType, AlloyRelation, AlloyAtom } from "./alloy-instance";
import { STYLE_TEMPLATE, SUBSTANCE_TEMPLATE, DOMAIN_TEMPLATE } from "./penrosetemplates";

import { LayoutInstance } from "./layoutinstance";
import { isBuiltin } from "./alloy-instance/src/type";
import { atomIsBuiltin, getAtomType } from "./alloy-instance/src/atom";
import { getInstanceRelationsAndSkolems } from "./alloy-instance/src/instance";

export class PenroseInstance {

    private readonly _alloyInstance: AlloyInstance;
    private readonly _layoutInstance: LayoutInstance;
    private readonly _defined_types: Record<string, AlloyType>;
    private readonly _defined_relations: Record<string, AlloyRelation>;

    private readonly _instanceRelationsAndSkolems : AlloyRelation[];

    constructor(public alloyInstance: AlloyInstance, layoutInstance: LayoutInstance) {
        this._alloyInstance = alloyInstance;
        this._defined_types = this._alloyInstance.types;
        this._defined_relations = this._alloyInstance.relations;
        this._layoutInstance = layoutInstance;
        this._instanceRelationsAndSkolems = getInstanceRelationsAndSkolems(this._alloyInstance);
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
            //.filter(([type, type_data]) => !(isBuiltin(type_data) && this.SKIP_BUILTIN))
            .map(([type, type_data]) => {

                let type_id = this.cleanType(type_data.id);
                // This is heirarchy of the type, and I believe it is ordered (with the 0th element being the type itself)
                let type_heirarchy = type_data.types;

                // If type_heirarchy[1] exists, that is the supertype else, it is _Vertex OR _Cluster
                let supertype = this.cleanType(type_heirarchy[1]) || "_Vertex";
                let x: TypeElement = { type: type_id, supertype: supertype };
                return x;
            });


        /// We now have a list of types and super types. How can we order them so the super types are declared first?
        let type_defs_sorted = sortTypes(type_defs);
        let type_defs_str = type_defs_sorted.map((x) => `type ${x.type} <: ${x.supertype}`).join("\n");


        let relation_defs = Object.entries(this._defined_relations)
            .map(([rel, rel_data]) => {

                let pname = this.ensureValidId(rel_data.name);
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

        let clusters: Record<string, Record<string, string[]>> = {};
        let relationEntries = Object.entries(this._defined_relations);

        relationEntries
            .filter(([rel, rel_data]) => {

                if (!rel_data) {
                    return false;
                }

                let fieldName = this.ensureValidId(rel_data.name);
                return this._layoutInstance.shouldClusterOnField(fieldName);
            })
            .forEach(([rel, rel_data]) => {

                let fieldName = this.ensureValidId(rel_data.name);

                let clusterForRelation: Record<string, string[]> = {};

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
            Object.values(clusterData).forEach((clusterTargets) => {
                clusterTargets.forEach((atom) => {
                    allAtoms.add(atom);
                });
            });

            let inClusterObjects = Object.entries(clusterData).map(([clusterName, clusterTargets]) => {

                let clusterDef = `_Cluster ${clusterName}
                                    Label ${clusterName} "${clusterName}"\n
                                    `;
                let clusterAtoms = clusterTargets.map((atom) => {
                    return `_layoutInCluster( ${clusterName},  ${atom})`;
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
                return clusterAtomConstraints;
            });

            return [prefix, inClusterObjects.join("\n"), notInClusterObjects.join("\n")].join("\n");
        });

        let clusterString = cluster_objects.join("\n");




        // Each atom of each type becomes a domain object
        let domain_objects = Object.entries(this._defined_types)
            .map(([type, type_data]) => {

                let type_id = this.cleanType(type_data.id);

                // If an atom represents a cluster don't add an instantiation for it here //
                let atoms = type_data.atoms.filter((atom) => !this.atomIsClusterKey(atom.id, clusters))
                                            .filter((atom) => this.shouldShowAtom(atom.id));

                if (atoms.length == 0) {
                    return "";
                }

                let atomLabels = atoms.map((atom) => {
                    return `Label ${this.ensureValidId(atom.id)} "${atom.id}"`;
                }).join("\n");

                let atom_ids = atoms.map((atom) => {
                    return this.ensureValidId(atom.id);
                });
                let atom_str = atom_ids.join(", ");

                // Don't autolabel here. Explicitly gen your labels, so that we can have the weird chars.
                return `${type_id} ${atom_str}` + "\n" + atomLabels;


            });
        let domain_objects_str = domain_objects.join("\n");


        if (relationEntries == undefined || relationEntries.length == 0) {
            return [SUBSTANCE_TEMPLATE, domain_objects_str].join("\n");
        }











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
        return this.ensureValidId(t);
    }

    private ensureValidId(id: string): string {
        if (!id) {
            return "";
        }

        /// If id starts with a number, we need to prepend it with an underscore
        if (id.match(/^\d/)) {
            id = "_" + id;
        }

        // Will have to be able to reverse engineer these so that we can get the original id back for
        // labels, cluster name, etc.

        return id.replace(/\$/g, "").replace(/\//g, "__").replace(/-/g, "_neg_")
            .replace(/>/g, "_gt_").replace(/</g, "_lt_").replace(/=/g, "_eq_");
    }

    private getClusterName(atoms: string[]): string {

        if (atoms.length < 2) {
            // We can't cluster a single atom
            return "";
        }

        let pertinentAtoms = atoms.slice(1).map((atom) => this.ensureValidId(atom));


        let clusterName = pertinentAtoms.join("_arrow_");
        return clusterName;

    }


    atomIsClusterKey(atom: string, clusters: Record<string, Record<string, string[]>>): boolean {
        let atomCleaned = this.ensureValidId(atom);
        let clusterDicts = Object.values(clusters);

        for (let clusterDict of clusterDicts) {
            if (Object.keys(clusterDict).includes(atomCleaned)) {
                return true;
            }
        }
        return false;
    }



    private shouldShowAtom(atom: string): boolean {

        // Check if the atom is a builtin type
        let builtin = atomIsBuiltin(this._alloyInstance, atom);
        let t = getAtomType(this._alloyInstance, atom);
        
        // Check if atom is in _instanceRelationsAndSkolems

        let includedInRelations = this._instanceRelationsAndSkolems.some((rel) => {

            return rel.tuples.some((tuple) => {
                if (tuple.atoms.includes(atom)) {
                    return true;
                }
                return false;
            });
        });

        return includedInRelations || !builtin;
    }
}