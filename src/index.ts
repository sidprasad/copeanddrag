// src/index.ts
import * as http from 'http';
import { AlloyDatum, AlloyInstance, parseAlloyXML } from './alloy-instance';
import { generateGraph } from './alloy-graph';


//import { PenroseInstance } from './penroseinstance';
import { LayoutInstance } from './layoutinstance';
import multer from 'multer';
import { graphToWebcola } from './webcola-gen/graphtowebcola';
import { PenroseInstance } from './penrose-gen/graphtopenrose';


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

    let g = generateGraph(instance, li);

    let pt = new PenroseInstance(g, li, instance);

    let s = pt.substance;
    let d = pt.domain;
    let sty = pt.style;
    res.render('penrosevjs', { 'substance': s, 'domain': d, 'style': sty });

});



app.post('/webcolafiles', (req, res) => {    
    let {instances, li} = getFormContents(req);

    /// Right now, we are only generating for the first instance ///
    let instance = instances[0];
    let g = generateGraph(instance, li);
    let colaDefinitions = graphToWebcola(g, li, instance);

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