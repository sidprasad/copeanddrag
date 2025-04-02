// src/index.ts
import * as http from 'http';
import { AlloyAtom, AlloyDatum, AlloyInstance, AlloyType, parseAlloyXML } from './alloy-instance';

import { LayoutInstance } from './layout/layoutinstance';

import { WebColaLayout } from './webcola-gen/graphtowebcola';
import { ConstraintValidator } from './layout/constraint-validator';
import { InstanceLayout } from './layout/interfaces';
import { copeToLayoutSpec } from './cope-lang/cope-parser';
import { parseLayoutSpec } from './layout/layoutspec';
import { instanceToInst } from './forge-util/instanceToInst';
import { Event, Logger, LogLevel } from './logging/logger';
import * as os from 'os';
import * as crypto from 'crypto'; 

const express = require('express');
const path = require('path');
import * as fs from 'fs';

// import axios
const axios = require('axios');


const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Set the limit for urlencoded and json payloads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));

// This is a hack. I'm not sure
// how to encode the version number.
const version = "2.2.3";

const secretKey = "cope-and-drag-logging-key";

// Function to get or generate a persistent user ID using HMAC
function getPersistentUserId(): string {
    const hostname = os.hostname();
    if (!hostname) {
        return "unknown" + Math.random().toString(4);
    } else {
        // Generate an HMAC of the hostname using the secret key
        const hmac = crypto.createHmac('sha256', secretKey);
        hmac.update(hostname);
        const userId = hmac.digest('hex');
        return userId;
    }
}

const userId = getPersistentUserId();
const logger = new Logger(userId, version);


function getFormContents(req: any) {

    let projections: Record<string, string> = {};
    const alloyDatum = req.body.alloydatum;


    if (!alloyDatum || alloyDatum.length == 0) {
        throw new Error("No instance to visualize provided.");
    }

    const cope = req.body.cope;


    
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



    try {
        var ad: AlloyDatum = parseAlloyXML(alloyDatum);
    }
    catch (e) {
        throw new Error("Error parsing Forge instance. May be malformed." + e.message);
    }
    let instances = ad.instances;
    let loopBack = ad.loopBack || -1;

    let coopeNonEmpty = cope && cope.length > 0;

    let layoutSpec = coopeNonEmpty ? copeToLayoutSpec(cope) : parseLayoutSpec("");
    let li = new LayoutInstance(layoutSpec);
    return { instances, li, instanceNumber, loopBack, projections };


}

// On a GET request, return the start CnD page.
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
        projectionData: [],
        source_content: "", //HACK
        sourceFileName: "",
        instAsString: "",
        errors: ""
    });
});



app.post('/', (req, res) => {
    const alloyDatum = req.body.alloydatum;
    const cope = req.body.cope;
    let error = "";

    // Logging and PERF.
    var loggingEnabled = (req.body.loggingEnabled == undefined) ? true : (req.body.loggingEnabled.toLowerCase() === 'enabled');
    const startTime = performance.now();

    try {

        var { instances, li, instanceNumber, loopBack, projections } = getFormContents(req);
        var num_instances = instances.length;

        if (instanceNumber >= num_instances) {
            throw new Error(`Temporal instance ${instanceNumber} number out of range. The temporal trace has only ${num_instances} states.`);
        } else if (loopBack != 0 && !loopBack) {
            loopBack = 0;
        }

        var internal_inconsistency = li.checkConstraintConsistency();
        if (!internal_inconsistency.consistent) {
            throw new Error(internal_inconsistency.error);
        }

        var instAsString = instanceToInst(instances[instanceNumber]);
        try{
            var { layout, projectionData } = li.generateLayout(instances[instanceNumber], projections);
        }
        catch(e){
            throw new Error("The instance being visualized is inconsistent with layout constraints.<br><br> " + e.message);
        }

        let cl = new WebColaLayout(layout);
        var colaConstraints = cl.colaConstraints;
        var colaNodes = cl.colaNodes;
        var colaEdges = cl.colaEdges;
        var colaGroups = cl.groupDefinitions;
        var height = cl.FIG_HEIGHT;
        var width = cl.FIG_WIDTH;
    }
    catch (e) {
        error = e.message;
        // If there is an error, we should not show the diagram.
        height = 0;
        width = 0;
        colaNodes = [];
        colaEdges = [];
        colaConstraints = [];
    }
    finally {
        let payload = {
            "alloyDatum": alloyDatum,
            "cope": cope,
            "error": error
        }

        let endTime = performance.now();
        var serverTime = endTime - startTime;
        console.log(`Server time: ${serverTime} ms`);

        if (loggingEnabled) {
            logger.log_payload(payload, LogLevel.INFO, Event.CND_RUN);
        }
    }

    res.render('diagram', {
        'height': height !== undefined ? height : 0,
        'width': width !== undefined ? width : 0,
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
        sourceFileName: "",
        instAsString,
        errors: error.replace(/\n/g, "<br>"),
        loggingEnabled
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
    const projections: Record<string, string> = {};

    let ad: AlloyDatum = parseAlloyXML(alloyDatum);
    let instances = ad.instances;
    let num_instances = instances.length;
    let loopBack = ad.loopBack || -1;
    let layoutSpec = copeToLayoutSpec(cope);
    let li = new LayoutInstance(layoutSpec);


    try{
        var { layout, projectionData } = li.generateLayout(instances[instanceNumber], projections);
    }
    catch(e){
        throw new Error("The instance being visualized is inconsistent with layout constraints.<br><br> " + e.message);
    }

    var instAsString = instanceToInst(instances[instanceNumber]);
    let cl = new WebColaLayout(layout);
    let colaConstraints = cl.colaConstraints;
    let colaNodes = cl.colaNodes;
    let colaEdges = cl.colaEdges;
    let colaGroups = cl.groupDefinitions;

    let height = cl.FIG_HEIGHT;
    let width = cl.FIG_WIDTH;

    res.render('diagram', {
        'height': height,
        'width': width,
        'colaNodes': colaNodes,
        'colaEdges': colaEdges,
        'colaConstraints': colaConstraints,
        'colaGroups': colaGroups,
        instanceNumber,
        num_instances,
        layoutAnnotation: "",
        alloyDatum,
        loopBack,
        cope,
        projectionData,
        source_content,
        sourceFileName,
        instAsString,
        errors: "",
        loggingEnabled: true
    });


});

const server = http.createServer(app);

const PORT = process.env.PORT || 3000; 
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});

const shutdown = () => {
    console.log('Received termination signal, shutting down gracefully...');
    server.close(() => {
        console.log('Closed out remaining connections.');
        process.exit(0);
    });

    // Forcefully shut down after 10 seconds
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};



app.post('/timing', (req, res) => {
    const clientTime = req.body.clientTime;

    console.log(`Client time: ${clientTime} ms`);
    res.json({ message: 'Client time received successfully' });
});

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);