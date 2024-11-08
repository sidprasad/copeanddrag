// src/index.ts
import * as http from 'http';
import { AlloyAtom, AlloyDatum, AlloyInstance, AlloyType, parseAlloyXML } from './alloy-instance';

import { LayoutInstance } from './layout/layoutinstance';

import { WebColaLayout } from './webcola-gen/graphtowebcola';
import { ConstraintValidator } from './webcola-gen/constraint-validator';
import { InstanceLayout } from './layout/interfaces';
import {copeToLayoutSpec} from './cope-lang/cope-parser';
import { parseLayoutSpec } from './layout/layoutspec';

const express = require('express');
const path = require('path');
import * as fs from 'fs';


const app = express();
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set('view engine', 'ejs');


function getFormContents(req: any) {
    const alloyDatum = req.body.alloydatum;
    const layoutAnnotation = req.body.layoutannotation;
    const cope = req.body.cope;


    /*

        Get ALL form elements ending with _projection
    */
    let projections : Record<string, string>= {};
    let keys = Object.keys(req.body);
    for (let key of keys) {
        if (key.endsWith("_projection")) {

            //First get the key up to '_projection'
            let projectedType = key.substring(0, key.length - "_projection".length);
            let projectedAtom = req.body[key];
            projections[projectedType] = projectedAtom;
        }
    }

    const instanceNumber = parseInt(req.body.instancenumber);

    let ad: AlloyDatum = parseAlloyXML(alloyDatum);
    let instances = ad.instances;
    let loopBack = ad.loopBack || -1;

    let coopeNonEmpty = cope && cope.length > 0;

    let layoutSpec = coopeNonEmpty ? copeToLayoutSpec(cope) : parseLayoutSpec(layoutAnnotation);

    let li = new LayoutInstance(layoutSpec);

    return { instances, li, instanceNumber, loopBack, projections };
}



app.get('/', (req, res) => {


    res.render('diagram', {
        'height': 0,
        'width': 0,
        'colaNodes': [],
        'colaEdges': [],
        'colaConstraints': [],
        'colaGroups': [],
        instanceNumber: 0,
        num_instances: 0,
        layoutAnnotation: "",
        alloyDatum: "",
        cope: "",
        projectionData : []
    });


});

app.post('/', (req, res) => {


    const alloyDatum = req.body.alloydatum;
    const layoutAnnotation = req.body.layoutannotation;
    const cope = req.body.cope;

    let { instances, li, instanceNumber, loopBack, projections} = getFormContents(req);

    let num_instances = instances.length;

    if (instanceNumber >= num_instances) {
        res.status(418).send("Instance number out of range");
        return;
    } else if (loopBack != 0 && !loopBack) {
        loopBack = 0;
    }

    let {layout, projectionData }  = li.generateLayout(instances[instanceNumber], projections);

    // if (error) {

    //     // TODO: THe reporting here should be more meaningful at some point.
    //     // TODO: Change the output.

    //     let internally_inconsistent = "Internally inconsistent constraints: " + error;

    //     console.error(internally_inconsistent);
    //     // This is "I am a teapot" error code, which is a joke error code.
    //     res.status(418).send(internally_inconsistent);
    //     return;
    // }


    let cl = new WebColaLayout(layout);
    let colaConstraints = cl.colaConstraints;
    let colaNodes = cl.colaNodes;
    let colaEdges = cl.colaEdges;
    let colaGroups = cl.groupDefinitions;



    const constraintValidator = new ConstraintValidator(colaConstraints, colaNodes, colaGroups);
    const inconsistent_error = constraintValidator.validateConstraints();
    if (inconsistent_error) {

        // TODO: THe reporting here should be more meaningful at some point.
        // TODO: Change the output.

        console.error("Error validating constraints:", error);
        // This is "I am a teapot" error code, which is a joke error code.
        res.status(418).send(inconsistent_error);
        return;
    }


    let height = cl.FIG_HEIGHT ;
    let width = cl.FIG_WIDTH ;

    res.render('diagram', {
        'height': height,
        'width': width,
        'colaNodes': colaNodes,
        'colaEdges': colaEdges,
        'colaConstraints': colaConstraints,
        'colaGroups': colaGroups,
        instanceNumber,
        num_instances,
        layoutAnnotation,
        alloyDatum,
        loopBack,
        cope,
        projectionData
    });
});





// Need to do this better, but for now, 
// reuse code.
app.get('/example/:name', (req, res) => {
    // Get the example name
    let exampleName = req.params.name;

    // Define the path to the /examples directory
    const examplesDir = path.join(
                            path.join(
                                path.join(__dirname, '..', 'examples'), 
                                    'paper-examples'),    
                        exampleName);

    // Check if the directory exists
    if (!fs.existsSync(examplesDir)) {
        res.status(404).send('Example not found');
        return;
    }


   const datumFile = path.join(examplesDir, 'datum.xml');
   const cndFile = path.join(examplesDir, 'layout.cnd');

   // Ignore for now
   let displayConfig = path.join(examplesDir, 'displayConfig.yml');

    // Ensure the files exist
    if (!fs.existsSync(datumFile) || !fs.existsSync(cndFile)) {
        res.status(404).send('Example not found');
        return;
    }

    // Read the files
    const alloyDatum = fs.readFileSync(datumFile, 'utf8');
    const cope = fs.readFileSync(cndFile, 'utf8');
    
    // Eventually, read these from the displayConfig file
    const instanceNumber = 0;
    const projections : Record<string, string>= {};

    let ad: AlloyDatum = parseAlloyXML(alloyDatum);
    let instances = ad.instances;
    let num_instances = instances.length;
    let loopBack = ad.loopBack || -1;
    let layoutSpec = copeToLayoutSpec(cope);
    let li = new LayoutInstance(layoutSpec);

    

    //// It is not good hygiene to repeat code like this.

    let {layout, projectionData }  = li.generateLayout(instances[instanceNumber], projections);


    let cl = new WebColaLayout(layout);
    let colaConstraints = cl.colaConstraints;
    let colaNodes = cl.colaNodes;
    let colaEdges = cl.colaEdges;
    let colaGroups = cl.groupDefinitions;

    const constraintValidator = new ConstraintValidator(colaConstraints, colaNodes, colaGroups);
    const error = constraintValidator.validateConstraints();
    if (error) {

        // TODO: THe reporting here should be more meaningful at some point.
        console.error("Error validating constraints:", error);
        // This is "I am a teapot" error code, which is a joke error code.
        res.status(418).send(error);
        return;
    }


    let height = cl.FIG_HEIGHT ;
    let width = cl.FIG_WIDTH ;

    res.render('diagram', {
        'height': height,
        'width': width,
        'colaNodes': colaNodes,
        'colaEdges': colaEdges,
        'colaConstraints': colaConstraints,
        'colaGroups': colaGroups,
        instanceNumber,
        num_instances,
        layoutAnnotation : "",
        alloyDatum,
        loopBack,
        cope,
        projectionData
    });


});

const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});