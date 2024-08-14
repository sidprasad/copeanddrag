// src/index.ts
import * as http from 'http';
import { AlloyAtom, AlloyDatum, AlloyInstance, AlloyType, parseAlloyXML } from './alloy-instance';
import { generateGraph } from './alloy-graph';

import { LayoutInstance } from './layoutinstance';

import { WebColaLayout } from './webcola-gen/graphtowebcola';
import { PenroseInstance } from './penrose-gen/graphtopenrose';

import { applyProjections } from './alloy-instance/src/projection';

import { ConstraintValidator } from './cassowary-layout/constraint-validator';

const express = require('express');
const path = require('path');


const app = express();
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set('view engine', 'ejs');



function getFormContents(req: any) {
    const alloyDatum = req.body.alloydatum;
    const layoutAnnotation = req.body.layoutannotation;
    const instanceNumber = parseInt(req.body.instancenumber);

    let ad : AlloyDatum = parseAlloyXML(alloyDatum);
    let instances = ad.instances;

    let li = new LayoutInstance(layoutAnnotation);

    return {instances, li, instanceNumber};
}


function applyLayoutProjections(ai : AlloyInstance, li : LayoutInstance) : AlloyInstance {

    let projectedSigs : string[] = li.projectedSigs;
    let projectedTypes : AlloyType[] = projectedSigs.map((sig) => ai.types[sig]);
    // Then get the the atoms of the projected types
    let projectedAtoms : AlloyAtom[] = projectedTypes.flatMap((type) => type.atoms);
    let projectedAtomIds : string[] = projectedAtoms.map((atom) => atom.id);

    // Get new instance, calling applyProjectioons
    let projectedInstance = applyProjections(ai, projectedAtomIds);
    return projectedInstance;
}


app.post('/penrosefiles', (req, res) => {    
    let {instances, li, instanceNumber} = getFormContents(req);
    let instance = applyLayoutProjections(instances[instanceNumber], li);

    let g = generateGraph(instance, li);

    let pt = new PenroseInstance(g, li, instance);

    let s = pt.substance;
    let d = pt.domain;
    let sty = pt.style;
    res.render('penrosevjs', { 'substance': s, 'domain': d, 'style': sty });

});



app.post('/webcolafiles', (req, res) => {    
    let {instances, li, instanceNumber} = getFormContents(req);
    let instance = applyLayoutProjections(instances[instanceNumber], li);


    let g = generateGraph(instance, li);
    
    let cl = new WebColaLayout(g, li, instance);
    let colaDefinitions = cl.layout();

    const constraintValidator = new ConstraintValidator(colaDefinitions.colaConstraints, colaDefinitions.colaNodes);
    const error = constraintValidator.validateConstraints();
    if (error) {
        console.error("Error validating constraints:", error);
        // This is "I am a teapot" error code, which is a joke error code.
        res.status(418).send(error);
        return;
    }

    try {
        // Serialize and then parse to strip non-serializable parts
        let serializedColaNodes = JSON.parse(JSON.stringify(colaDefinitions.colaNodes));
        let serializedColaEdges = JSON.parse(JSON.stringify(colaDefinitions.colaEdges));
        let serializedColaConstraints = JSON.parse(JSON.stringify(colaDefinitions.colaConstraints));
        let serializedColaGroups = JSON.parse(JSON.stringify(colaDefinitions.colaGroups));
        res.render('webcolavis', { 'height': 800, 'width': 1000, 'colaNodes': serializedColaNodes, 'colaEdges': serializedColaEdges, 'colaConstraints' : serializedColaConstraints, 'colaGroups': serializedColaGroups });
    } catch (error) {
        console.error("Error serializing colaNodes, colaEdges, colaConstraints or colaGroups:", error);
        // Handle the error appropriately
        res.status(500).send("Internal Server Error");
    }
});





const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});