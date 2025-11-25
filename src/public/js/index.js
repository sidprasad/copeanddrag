function instanceToInst(instance) {
    let inst = "";


    const PREFIX = "inst  cnd_generated {";

    const POSTFIX = "}";

    // First declare all the ATOMS (I think in order?)
    let instanceTypes = instance.types;


    
    // Create a dict where the key is the type id and the value is the atoms
    let typeAtoms = {};
    for (let typeId in instanceTypes) {
        let type = instanceTypes[typeId];
        let atoms = type.atoms;
        typeAtoms[typeId] = atoms.map(atom => `\`${atom.id}`);
    }

    // Then declare all the relations
    let instanceRelations = instance.relations;
    let relationDecls= {};

    for (let relationId in instanceRelations) {
        let relation = instanceRelations[relationId];
        let tuples = relation.tuples;
        let tupleStrings = tuples.map(tuple => {

            // TODO: What about backticks?

            let tupleString = tuple.atoms.map(a => `\`${a}`).join("->");
            return `(${tupleString})`;
        });

        let relName = relation.name;

        relationDecls[relName] = tupleStrings;
    }

    // Now we can create the inst string
    // First, declare all the atoms in order
    for (let typeId in typeAtoms) {
        let atoms = typeAtoms[typeId];
        if(atoms.length > 0) {
            inst += `${typeId} = ${atoms.join("+")}\n`;
        }
    }

    // Then declare all the relations
    for (let relationId in relationDecls) {
        let tuples = relationDecls[relationId];
        if (tuples.length > 0) {
            inst += `${relationId} = ${tuples.join("+")}\n`;
        }
        else {
            inst += `no ${relationId}\n`;
        }
    }



    return `${PREFIX}\n${inst}\n${POSTFIX}`;
}

function instanceToTables(instance) {
    let instanceTypes = instance.types;
    let instanceRelations = instance.relations;

    // Create a dict where the key is the type id and the value is the atoms
    let atomsTable = {};
    for (let typeId in instanceTypes) {
        let type = instanceTypes[typeId];
        let atoms = type.atoms;

        let atomsAsString = atoms.map(atom => atom.id);
        if (atomsAsString.length > 0) {
            atomsTable[typeId] = atomsAsString;
        }

        //atomsTable[typeId] = atoms.map(atom => atom.id);
    }




    let relationTable = {};

    for (let relationId in instanceRelations) {
        let relation = instanceRelations[relationId];
        const relName = relation.name;
        let tuples = relation.tuples;

        // Now I want each tuple to be mapped to a string array.
        let tuplesAsArrays = tuples.map(tuple => {
            return tuple.atoms;
        });


        if (tuplesAsArrays.length > 0) {
            relationTable[relName] = tuplesAsArrays;
        }
    }


    return {
        atoms: atomsTable,
        relations: relationTable
    };
}

window.instanceToInst = instanceToInst;
window.instanceToTables = instanceToTables;