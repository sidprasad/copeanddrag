// src/index.ts
import * as http from 'http';
import { AlloyAtom, AlloyDatum, AlloyInstance, AlloyType, parseAlloyXML } from './alloy-instance';
import { generateGraph } from './alloy-graph';

import { LayoutInstance } from './layoutinstance';

import { WebColaLayout } from './webcola-gen/graphtowebcola';
import { PenroseInstance } from './penrose-gen/graphtopenrose';

import { applyProjections } from './alloy-instance/src/projection';

import { CassowaryLayout } from './cassowary-layout/cassowary-layout';

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
    //let colaDefinitions = graphToWebcola(g, li, instance);

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


app.post('/cassowaryfiles', (req, res) => {
    try {
        let { instances, li, instanceNumber } = getFormContents(req);
        let instance = applyLayoutProjections(instances[instanceNumber], li);

        let g = generateGraph(instance, li);

        let kl = new CassowaryLayout(g, li, instance);

        let layout = kl.layout();
        let nodes = layout.nodes;
        let edges = layout.edges;
        let groupBoundingBoxes = layout.groupBoundingBoxes;

        res.render('cassowaryvis', { 'height': 800, 'width': 1000, 'nodes': nodes, 'edges': edges});
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
});

// app.post('/z3files', async (req, res) => {
//     try {
//         let { instances, li, instanceNumber } = getFormContents(req);
//         let instance = applyLayoutProjections(instances[instanceNumber], li);

//         let g = generateGraph(instance, li);

//         let zl = new Z3Layout(g, li, instance);

//         let layout = await zl.layout();
//         let nodes = layout.nodes;
//         let edges = layout.edges;

//         res.render('cassowaryvis', { 'height': 800, 'width': 1000, 'nodes': nodes, 'edges': edges});
//     } catch (error) {
//         console.log(error);
//         res.status(500).send(error);
//     }
// }


const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});