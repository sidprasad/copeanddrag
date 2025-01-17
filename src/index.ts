// src/index.ts
import * as http from 'http';
import { AlloyAtom, AlloyDatum, AlloyInstance, AlloyType, parseAlloyXML } from './alloy-instance';

import { LayoutInstance } from './layout/layoutinstance';

import { WebColaLayout } from './webcola-gen/graphtowebcola';
import { ConstraintValidator } from './webcola-gen/constraint-validator';
import { InstanceLayout } from './layout/interfaces';
import {copeToLayoutSpec} from './cope-lang/cope-parser';
import { parseLayoutSpec } from './layout/layoutspec';
import { instanceToInst } from './forge-util/instanceToInst';

const express = require('express');
const path = require('path');
import * as fs from 'fs';


const app = express();
app.use(express.static(path.join(__dirname, 'public')));

// Set the views directory
app.set('views', path.join(__dirname, 'views'));


app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set('view engine', 'ejs');


function getFormContents(req: any) {
    let error = "";
    let projections : Record<string, string>= {};
    const alloyDatum = req.body.alloydatum;
    const cope = req.body.cope;

    try {


        /*
            Get ALL form elements ending with _projection
        */

        let keys = Object.keys(req.body);
        for (let key of keys) {
            if (key.endsWith("_projection")) {

                //First get the key up to '_projection'
                let projectedType = key.substring(0, key.length - "_projection".length);
                let projectedAtom = req.body[key];
                projections[projectedType] = projectedAtom;
            }
        }

        const instanceNumber = parseInt(req.body.instancenumber) || 0;

        let ad: AlloyDatum = parseAlloyXML(alloyDatum);
        let instances = ad.instances;
        let loopBack = ad.loopBack || -1;

        let coopeNonEmpty = cope && cope.length > 0;

        let layoutSpec = coopeNonEmpty ? copeToLayoutSpec(cope) : parseLayoutSpec("");
        let li = new LayoutInstance(layoutSpec);
        return { instances, li, instanceNumber, loopBack, projections, error };
    }
    catch (e) {
        error = e.message;
        return {error}
    }


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
        alloyDatum: "",
        cope: "",
        projectionData : [],
        source_content: "", //HACK
        sourceFileName : "",
        instAsString : "",
        errors : ""
    });


});

app.post('/', (req, res) => {
    const alloyDatum = req.body.alloydatum;
    const cope = req.body.cope;


    // TODO: More errors about the layout.


    // TODO: We need to be able to get errors here no?
    // Empty spec error.
    let fc = getFormContents(req);
    let error = fc.error;

    if(error != "") {
        // This is an issue! TODO: Return here!
        // BUT WE SHOULD DO BETTER. REALLY I WISH I HAD SOME KIND OF WRAPPER THAT
        // RETURNED MOST THINGS IF ERROR WAS DEFINED.
        return error;
    }

    let { instances, li, instanceNumber, loopBack, projections} = getFormContents(req);

    let num_instances = instances.length;

    if (instanceNumber >= num_instances) {
        error = `Temporal instance ${instanceNumber} number out of range. The temporal trace has only ${num_instances} states.`;
    } else if (loopBack != 0 && !loopBack) {
        loopBack = 0;
    }

    let internal_inconsistency = li.checkConstraintConsistency();
    if (!internal_inconsistency.consistent) {
        error = error || internal_inconsistency.error;
    }

    const instAsString = instanceToInst(instances[instanceNumber]);
    let {layout, projectionData }  = li.generateLayout(instances[instanceNumber], projections);

    let cl = new WebColaLayout(layout);
    let colaConstraints = cl.colaConstraints;
    let colaNodes = cl.colaNodes;
    let colaEdges = cl.colaEdges;
    let colaGroups = cl.groupDefinitions;
    let height = cl.FIG_HEIGHT ;
    let width = cl.FIG_WIDTH ;


    const constraintValidator = new ConstraintValidator(colaConstraints, colaNodes, colaGroups);
    const inconsistent_error = constraintValidator.validateConstraints();
    if (inconsistent_error) {
        // Conflict between constraints and instance
        error = error || "The instance being visualized is inconsistent with layout constraints.<br><br> " + inconsistent_error;
    }

    // BUT ALSO, the moment there is an error we should not do the
    // rest. E.g., get cola nodes, colka edges, etc.


    res.render('diagram', {
        'height': height,
        'width': width,
        'colaNodes': colaNodes,
        'colaEdges': colaEdges,
        'colaConstraints': colaConstraints,
        'colaGroups': colaGroups,
        instanceNumber,
        num_instances,
        alloyDatum,
        loopBack,
        cope,
        projectionData,
        source_content: "", //HACK
        sourceFileName : "",
        instAsString,
        errors: error
    });
});


app.get('/example', (req, res) => {

    const examplesDir = path.join(path.join(__dirname, '..', 'examples'), 'paper-examples');

    // Get the names of all the directories in examplesDir
    let exampleNames = fs.readdirSync(examplesDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    res.render('examplehome', { exampleNames });
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

    var source_content = "";
    var sourceFileName = "";



   let sourceAlloyPath = path.join(examplesDir, 'source.als');
   let sourceFrgPath = path.join(examplesDir, 'source.frg');


    let srcAlloy = fs.existsSync(sourceAlloyPath) ? fs.readFileSync(sourceAlloyPath, 'utf8') : "";
    let srcFrg = fs.existsSync(sourceFrgPath) ? fs.readFileSync(sourceFrgPath, 'utf8') : "";


    if (srcAlloy.length > 0) {
        source_content = srcAlloy;
        sourceFileName = `${exampleName}.als`;
    }
    else if (srcFrg.length > 0) {
        source_content = srcFrg;
        sourceFileName = `${exampleName}.frg`;
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

    const instAsString = instanceToInst(instances[instanceNumber]);
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
        projectionData,
        source_content,
        sourceFileName,
        instAsString
    });


});

const server = http.createServer(app);

const PORT = process.env.PORT || 3001; // TODO: Revert!
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});