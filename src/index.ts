// src/index.ts
import * as http from 'http';
import { AlloyDatum, AlloyInstance, parseAlloyXML } from './alloy-instance';
import { generateGraph } from './alloy-graph';


import { PenroseInstance } from './penroseinstance';
import { LayoutInstance } from './layoutinstance';
import multer from 'multer';
import { graphToWebcola } from './webcola-gen/graphtowebcola';


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

    let ad : AlloyDatum = parseAlloyXML(alloyDatum);
    let instances = ad.instances;

    let li = new LayoutInstance(layoutAnnotation);

    return {instances, li};
}


app.post('/penrosefiles', (req, res) => {    
    let {instances, li} = getFormContents(req);
    let instance = instances[0];

    //let g = generateGraph(instance);


    /// TODO: MODIFY THE PENROSE INSTANCE TO
    // USE a graph and layout instance


    let pt = new PenroseInstance(instance, li);

    let s = pt.getSubstance();
    let d = pt.getDomain();
    let sty = pt.getStyle();
    res.render('penrosevjs', { 'substance': s, 'domain': d, 'style': sty });

});

app.post('/webcolafiles', (req, res) => {    
    let {instances, li} = getFormContents(req);

    /// Right now, we are only generating for the first instance ///
    let instance = instances[0];
    let g = generateGraph(instance);
    let colaDefinitions = graphToWebcola(g, li);

    try {
        // Serialize and then parse to strip non-serializable parts
        let serializedColaNodes = JSON.parse(JSON.stringify(colaDefinitions.colaNodes));
        let serializedColaEdges = JSON.parse(JSON.stringify(colaDefinitions.colaEdges));
        let serializedColaConstraints = JSON.parse(JSON.stringify(colaDefinitions.colaConstraints));
        let serializedColaGroups = JSON.parse(JSON.stringify(colaDefinitions.colaGroups));

        res.render('webcolavis', { 'height': 800, 'width': 800, 'colaNodes': serializedColaNodes, 'colaEdges': serializedColaEdges, 'colaConstraints' : serializedColaConstraints, 'colaGroups': serializedColaGroups });
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