// src/index.ts
import * as http from 'http';
import { AlloyAtom, AlloyDatum, AlloyInstance, AlloyType, parseAlloyXML } from './alloy-instance';

import { LayoutInstance } from './layout/layoutinstance';

import { WebColaLayout } from './webcola-gen/graphtowebcola';
import { ConstraintValidator } from './layout/constraint-validator';
import { InstanceLayout } from './layout/interfaces';
import { LayoutSpec, parseLayoutSpec } from './layout/layoutspec';
import { instanceToInst, instanceToTables } from './forge-util/instanceToInst';
import { Event, Logger, LogLevel } from './logging/logger';
import * as os from 'os';
import * as crypto from 'crypto'; 

import { WrappedEvalResult, WrappedForgeEvaluator } from './forge-util/evaluatorUtil';

const express = require('express');
const path = require('path');
import * as fs from 'fs';

// import axios
const axios = require('axios');

import multer from 'multer';
import AdmZip from 'adm-zip';

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Set the limit for urlencoded and json payloads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));

// This is a hack. I'm not sure how to encode the version number.
const version = "3.2.1";

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

const upload = multer({ dest: 'uploads/' });

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
    let evaluator = new WrappedForgeEvaluator(alloyDatum);


    // Internal consistency checks happen here.
    let layoutSpec : LayoutSpec = parseLayoutSpec(cope);
    
    
    let li = new LayoutInstance(layoutSpec,  evaluator , instanceNumber);
    return { instances, li, instanceNumber, loopBack, projections };
}

function getTableFromRequest(req: any) {
    const alloyDatum = req.body.alloydatum;
    const instanceNumber = parseInt(req.body.instancenumber) || 0;
    try {
        var ad: AlloyDatum = parseAlloyXML(alloyDatum);
    }
    catch (e) {
        throw new Error("Error parsing Forge instance. May be malformed." + e.message);
    }

    let tables = instanceToTables(ad.instances[instanceNumber]);
    return tables;
}


function generateDiagram (req, res)  {
    const alloyDatum = req.body.alloydatum;
    const cope = req.body.cope;
    let error = "";

    // Logging and PERF.
    var loggingEnabled = (req.body.loggingEnabled == undefined) ? true : (req.body.loggingEnabled.toLowerCase() === 'enabled');
    const startTime = performance.now();

    try {
        var tables = getTableFromRequest(req) || {};
        var { instances, li, instanceNumber, loopBack, projections } = getFormContents(req);
        var num_instances = instances.length;

        if (instanceNumber >= num_instances) {
            throw new Error(`Temporal instance ${instanceNumber} number out of range. The temporal trace has only ${num_instances} states.`);
        } else if (loopBack != 0 && !loopBack) {
            loopBack = 0;
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
        instAsString,
        errors: error.replace(/\n/g, "<br>"),
        loggingEnabled,
        tables : tables
    });
}



// On a GET request, return the start CnD page.
app.get('/', (req, res) => {


    const instanceToTables : {
        atoms: Record<string, string[]>,
        relations: Record<string, string[][]>
    } = {
        atoms: {},
        relations: {}
    }

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
        // source_content: "", //HACK
        // sourceFileName: "",
        instAsString: "",
        errors: "",
        tables: instanceToTables
    });
});






app.post('/', generateDiagram);

app.get('/import', (req, res) => {
    res.render('import', {
        title: 'Import ZIP File',
        message: 'Upload a ZIP file containing datum.xml and layout.cnd to import your data.'
    });
});

app.post('/import', upload.single('file'), async (req, res) => {
    try {
        // Ensure a file was uploaded
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Load the uploaded ZIP file
        const zip = new AdmZip(req.file.path);

        // Extract datum.xml
        const datumEntry = zip.getEntry('datum.xml');
        if (!datumEntry) {
            return res.status(400).json({ error: 'datum.xml not found in the ZIP file' });
        }
        const datumContent = datumEntry.getData().toString('utf-8');

        // Ensure datumContent is passed as raw XML
        if (!datumContent.trim().startsWith('<')) {
            return res.status(400).json({ error: 'Invalid datum.xml content' });
        }

        // Extract layout.cnd
        const layoutEntry = zip.getEntry('layout.cnd');
        if (!layoutEntry) {
            return res.status(400).json({ error: 'layout.cnd not found in the ZIP file' });
        }
        const layoutContent = layoutEntry.getData().toString('utf-8');

        // Prepare the request body for the POST endpoint
        req.body = {
            alloydatum: datumContent,
            cope: layoutContent,
            instancenumber: 0, // Default to the first instance
            loggingEnabled: 'enabled' // Optional: Enable logging
        };

        // Call the generateDiagram function
        generateDiagram(req, res);
    } catch (error) {
        console.error('Error importing ZIP file:', error);
        res.status(500).json({ error: 'Failed to import ZIP file' });
    } finally {
        // Clean up the uploaded file
        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Failed to delete uploaded file:', err);
            });
        }
    }
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


app.post('/evaluator', (req, res) => {

    const alloyDatum : string = req.body.alloydatum;
    const expr : string = req.body.expression;
    const instanceNumber = parseInt(req.body.instancenumber) || 0;
    // And evaluate

    let resultString = "SOMETHING WENT WRONG";

    try {
    let evaluator = new WrappedForgeEvaluator(alloyDatum);
    let result : WrappedEvalResult = evaluator.evaluate(expr, instanceNumber);


    // result needs to be converted to a string
    resultString = result.prettyPrint();
    }
    catch (e) {

        // If e has the evaluatorError property, use that as the message
        if (e.evaluatorError) {
            resultString = e.evaluatorError;
        }
        else {
            resultString = e.message;
        }
    }

    // Finally, respond with the result
    res.json({ result: resultString });
});



app.post('/feedback', (req, res) => {



    /*
        req.body.alloydatum
        req.body.cope
        req.body.feedback
        req.body.error
        req.body.instanceNumber
    */

    let payload = {
        "alloyDatum": req.body.alloydatum,
        "cnd": req.body.cnd,
        "feedback": req.body.feedback,
        "error": req.body.error,
        "instanceNumber": req.body.instanceNumber
    }


    logger.log_payload(payload, LogLevel.INFO, Event.ERROR_FEEDBACK);
    res.json({ message: 'Thank you for your feedback.' });

});

app.get('/version', (req, res) => {
    const endpoints = [
        {
            path: '/',
            method: 'GET',
            description: 'Returns the main Cope and Drag page with an empty diagram.',
            requires: 'No input required.'
        },
        {
            path: '/',
            method: 'POST',
            description: 'Generates a diagram based on the provided Alloy instance and layout specification.',
            requires: {
                body: {
                    alloydatum: 'The Alloy instance in XML format.',
                    cope: 'The layout specification in YAML format.',
                    instancenumber: 'Optional. The temporal instance number (default is 0).',
                    loggingEnabled: 'Optional. Set to "enabled" or "disabled" (default is "enabled").'
                }
            }
        },
        {
            path: '/import',
            method: 'GET',
            description: 'Displays a page for uploading a ZIP file containing datum.xml and layout.cnd.',
            requires: 'No input required.'
        },
        {
            path: '/import',
            method: 'POST',
            description: 'Processes the uploaded ZIP file and generates a diagram.',
            requires: {
                file: 'A ZIP file containing datum.xml and layout.cnd.'
            }
        },
        {
            path: '/timing',
            method: 'POST',
            description: 'Receives client-side timing data for performance monitoring.',
            requires: {
                body: {
                    clientTime: 'The client-side execution time in milliseconds.'
                }
            }
        },
        {
            path: '/evaluator',
            method: 'POST',
            description: 'Evaluates a Forge expression against a given Alloy instance and returns the result.',
            requires: {
                body: {
                    alloydatum: 'The Alloy instance in XML format.',
                    expression: 'The Forge expression to evaluate.',
                    instancenumber: 'Optional. The temporal instance number (default is 0).'
                }
            }
        },
        {
            path: '/feedback',
            method: 'POST',
            description: 'Logs user feedback, including Alloy data, layout specification, and errors.',
            requires: {
                body: {
                    alloydatum: 'The Alloy instance in XML format.',
                    cnd: 'The layout specification in YAML format.',
                    feedback: 'User feedback text.',
                    error: 'Error details, if any.',
                    instanceNumber: 'The temporal instance number.'
                }
            }
        },
        {
            path: '/version',
            method: 'GET',
            description: 'Returns the current version of the application along with a list of available endpoints.',
            requires: 'No input required.'
        }
    ];

    res.json({
        version: version,
        description: 'Cope and Drag API Documentation',
        endpoints: endpoints
    });
});

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);