#!/usr/bin/env node

import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import express from 'express';
import multer from 'multer';
import AdmZip from 'adm-zip';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';

// Import core library functionality
import { AlloyDatum, AlloyInstance, parseAlloyXML } from '../lib/alloy-instance';
import { LayoutInstance } from '../lib/layout/layoutinstance';
import { WebColaLayout } from '../lib/webcola-gen/graphtowebcola';
import { ConstraintValidator } from '../lib/layout/constraint-validator';
import { InstanceLayout } from '../lib/layout/interfaces';
import { LayoutSpec, parseLayoutSpec } from '../lib/layout/layoutspec';
import { instanceToInst, instanceToTables } from '../lib/forge-util/instanceToInst';
import { Event, Logger, LogLevel } from '../lib/logging/logger';
import { WrappedEvalResult, WrappedForgeEvaluator } from '../lib/forge-util/evaluatorUtil';

const app = express();

// Configure Express
app.use(express.static(path.join(__dirname, '../client/public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Set the limit for urlencoded and json payloads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));

// Version and configuration
const version = "3.4.9";
const secretKey = "cope-and-drag-logging-key";

// Multer configuration for file uploads
const upload = multer({ dest: 'uploads/' });

// Logger instance
const logger = new Logger(secretKey, version);

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Cope and Drag API',
            version: version,
            description: 'API for Cope and Drag diagramming tool',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server',
            },
        ],
    },
    apis: ['./src/server/index.ts'], // Path to the API files
};

const specs = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Command line argument parsing
const argv = require('minimist')(process.argv.slice(2), {
    boolean: ['alignment-edges'],
    string: ['port', 'perf-logging'],
    number: ['diagramWidth'],
    alias: {
        p: 'port',
        a: 'alignment-edges',
        l: 'perf-logging',
        w: 'diagramWidth'
    },
    default: {
        port: process.env.PORT || 3000,
        'alignment-edges': true,
        'perf-logging': process.env.PERF_LOGGING || 'none',
        'diagramWidth': 50
    }
});

const PORT = parseInt(argv.port, 10);
const ENABLE_ALIGNMENT_EDGES = argv['alignment-edges'];
const PERF_LOGGING_LEVELS = {
    none: 0,
    info: 1,
    verbose: 2
};

const DIAGRAM_WIDTH = parseInt(argv.diagramWidth, 10) || 50;
const instanceColWidth = DIAGRAM_WIDTH;
const exploreColWidth = (100 - DIAGRAM_WIDTH) / 2;
const controlsColWidth = (100 - DIAGRAM_WIDTH) / 2;

const pll = (argv['perf-logging'] || 'none').toLowerCase();
const PERF_LOGGING_LEVEL = PERF_LOGGING_LEVELS[pll] ?? PERF_LOGGING_LEVELS.none;

console.log(`Widths: instanceColWidth: ${instanceColWidth}, exploreColWidth: ${exploreColWidth}, controlsColWidth: ${controlsColWidth}`);

// Helper functions
function getFormContents(req: any) {
    const alloyDatum = req.body.alloydatum;
    const cope = req.body.cope;

    let projections: Record<string, any> = {};
    
    let keys = Object.keys(req.body);
    for (let key of keys) {
        if (key.endsWith("_projection")) {
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
        throw new Error("Error parsing Forge instance. Is it well formed? <br> <pre>" + e.message + "</pre>");
    }

    let command = ad.command || "";
    let instances = ad.instances;
    let loopBack = ad.loopBack || -1;
    let evaluator = new WrappedForgeEvaluator(alloyDatum);

    let layoutSpec : LayoutSpec = parseLayoutSpec(cope);
    let li = new LayoutInstance(layoutSpec, evaluator, instanceNumber, ENABLE_ALIGNMENT_EDGES);
    
    return { instances, li, instanceNumber, loopBack, projections, command };
}

function getTableFromRequest(req: any) {
    const alloyDatum = req.body.alloydatum;
    const instanceNumber = parseInt(req.body.instancenumber) || 0;
    
    try {
        var ad: AlloyDatum = parseAlloyXML(alloyDatum);
    }
    catch (e) {
        throw new Error("Error parsing Forge instance. Is it well formed? <br> <pre>" + e.message + "</pre>");
    }

    let tables = instanceToTables(ad.instances[instanceNumber]);
    return tables;
}

function generateDiagram(req: any, res: any) {
    const alloyDatum = req.body.alloydatum;
    const cope = req.body.cope;
    let error = "";

    var loggingEnabled = (req.body.loggingEnabled == undefined) ? true : (req.body.loggingEnabled.toLowerCase() === 'enabled');
    const startTime = performance.now();

    function logEventTime(start: number, eventName: string, perfloglevel = PERF_LOGGING_LEVELS.info) {
        let t = performance.now() - start;
        if (PERF_LOGGING_LEVEL >= perfloglevel) {
            console.log(`${eventName} time: ${t} ms`);
        }
    }

    let scaleFactor = parseFloat(req.body.scaleFactor) || 5;

    try {
        var tables = getTableFromRequest(req) || {};
        var { instances, li, instanceNumber, loopBack, projections, command } = getFormContents(req);
        var num_instances = instances.length;

        try {
            if (instanceNumber >= num_instances) {
                throw new Error(`Temporal instance ${instanceNumber} number out of range. The temporal trace has only ${num_instances} states.`);
            } else if (loopBack != 0 && !loopBack) {
                loopBack = 0;
            }
        } finally {
            var parsingTime = performance.now() - startTime;
            logEventTime(startTime, "Parse and Static Checks", PERF_LOGGING_LEVELS.verbose);
        }

        var instAsString = instanceToInst(instances[instanceNumber]);
        try{
            var { layout, projectionData } = li.generateLayout(instances[instanceNumber], projections);
        }
        catch(e){
            throw new Error("<p>The instance being visualized is inconsistent with the Cope and Drag spec.<p> " + e.message);
        }
        finally {
            logEventTime(parsingTime, "Layout Validation + Translation", PERF_LOGGING_LEVELS.verbose);
        }

        let cl = new WebColaLayout(layout);
        var colaConstraints = cl.colaConstraints;
        var colaNodes = cl.colaNodes;
        var colaEdges = cl.colaEdges;
        var colaGroups = cl.groupDefinitions || [];
        var height = cl.FIG_HEIGHT;
        var width = cl.FIG_WIDTH;

    }
    catch (e) {
        error = e.message;
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

        logEventTime(startTime, "Total Server-Side", PERF_LOGGING_LEVELS.info);

        if (loggingEnabled) {
            logger.log_payload(payload, LogLevel.INFO, Event.CND_RUN);
        }
    }

    res.render('diagram', {
        'height': height !== undefined ? height : 0,
        'width': width !== undefined ? width : 0,
        'colaNodes': colaNodes,
        'colaEdges': colaEdges,
        'colaConstraints': colaConstraints || [],
        'colaGroups': colaGroups || [],
        instanceNumber,
        num_instances,
        alloyDatum,
        loopBack,
        cope,
        projectionData,
        instAsString,
        errors: error,
        loggingEnabled,
        tables : tables,
        scaleFactor : scaleFactor,
        command : command || "",
        instanceColWidth,
        exploreColWidth,
        controlsColWidth
    });
}

// Routes

/**
 * @openapi
 * /:
 *   get:
 *     tags:
 *      - Diagramming
 *     summary: Empty diagram.
 *     description: Returns the default Cope and Drag page with an empty diagram, no Alloy instance, and no layout specification.
 *     responses:
 *       200:
 *         description: HTML page with empty diagram
 *   post:
 *     summary: Generate diagram
 *     tags:
 *      - Diagramming
 *     description: Generates a diagram based on the provided Alloy instance and layout specification.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               alloydatum:
 *                 type: string
 *                 description: The Alloy instance in XML format.
 *               cope:
 *                 type: string
 *                 description: The Cope and Drag specification in YAML format.
 *               instancenumber:
 *                 type: integer
 *                 description: Optional. The temporal instance number (default is 0).
 *               loggingEnabled:
 *                 type: string
 *                 description: Optional. Set to "enabled" or "disabled" (default is "enabled").
 *     responses:
 *       200:
 *         description: HTML page with diagram
 */
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
        instAsString: "",
        errors: "",
        tables: instanceToTables,
        scaleFactor: 5,
        instanceColWidth,
        exploreColWidth,
        controlsColWidth,
        command : "",
    });
});

app.post('/', generateDiagram);

/**
 * @openapi
 * /import:
 *   get:
 *     summary: Select an exported Cope and Drag diagram to load.
 *     tags:
 *       - Load Exported Diagram
 *     description: Displays a form that allows you to upload exported Cope and Drag diagram.
 *     responses:
 *       200:
 *         description: HTML page for ZIP upload
 *   post:
 *     summary: Load an exported Cope and Drag diagram.
 *     tags:
 *       - Load Exported Diagram
 *     description: Loads a provided exported Cope and Drag diagram from a ZIP file.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: A ZIP file containing datum.xml and layout.cnd.
 *     responses:
 *       200:
 *         description: HTML page with diagram or error message
 */
app.get('/import', (req, res) => {
    res.render('import', {
        title: 'Import ZIP File',
        message: 'Upload a ZIP file containing datum.xml and layout.cnd to import your data.'
    });
});

app.post('/import', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const zip = new AdmZip(req.file.path);

        const datumEntry = zip.getEntry('datum.xml');
        if (!datumEntry) {
            return res.status(400).json({ error: 'datum.xml not found in the ZIP file' });
        }
        const datumContent = datumEntry.getData().toString('utf-8');

        if (!datumContent.trim().startsWith('<')) {
            return res.status(400).json({ error: 'Invalid datum.xml content' });
        }

        const layoutEntry = zip.getEntry('layout.cnd');
        if (!layoutEntry) {
            return res.status(400).json({ error: 'layout.cnd not found in the ZIP file' });
        }
        const layoutContent = layoutEntry.getData().toString('utf-8');

        req.body = {
            alloydatum: datumContent,
            cope: layoutContent,
            instancenumber: 0,
            loggingEnabled: 'enabled'
        };

        generateDiagram(req, res);
    } catch (error) {
        console.error('Error importing ZIP file:', error);
        res.status(500).json({ error: 'Failed to import ZIP file' });
    } finally {
        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Failed to delete uploaded file:', err);
            });
        }
    }
});

/**
 * @openapi
 * /timing:
 *   post:
 *     summary: Submit client timing data
 *     tags:
 *      - Telemetry
 *     description: Receives client-side timing data for performance monitoring.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               clientTime:
 *                 type: number
 *                 description: The client-side execution time (a proxy for WebCola execution time) in milliseconds.
 *     responses:
 *       200:
 *         description: Success message
 */
app.post('/timing', (req, res) => {
    const clientTime = req.body.clientTime;

    if (PERF_LOGGING_LEVEL >= PERF_LOGGING_LEVELS.info) {
        console.log(`Client-Side time: ${clientTime} ms`);
    }
    res.json({ message: 'Client time received successfully' });
});

/**
 * @openapi
 * /evaluator:
 *   post:
 *     summary: Evaluate Forge expression
 *     tags:
 *      - Diagramming
 *     description: Evaluates a Forge expression against a given Alloy instance and returns the result.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               alloydatum:
 *                 type: string
 *                 description: The Alloy instance in XML format.
 *               expression:
 *                 type: string
 *                 description: The Forge expression to evaluate.
 *               instancenumber:
 *                 type: integer
 *                 description: Optional. The temporal instance number (default is 0).
 *     responses:
 *       200:
 *         description: Evaluation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *                   description: The evaluation result or error message.
 */
app.post('/evaluator', (req, res) => {
    const alloyDatum : string = req.body.alloydatum;
    const expr : string = req.body.expression;
    const instanceNumber = parseInt(req.body.instancenumber) || 0;

    let resultString = "SOMETHING WENT WRONG";

    try {
        let evaluator = new WrappedForgeEvaluator(alloyDatum);
        let result : WrappedEvalResult = evaluator.evaluate(expr, instanceNumber);
        resultString = result.prettyPrint();
    }
    catch (e) {
        if (e.evaluatorError) {
            resultString = e.evaluatorError;
        }
        else {
            resultString = e.message;
        }
    }

    res.json({ result: resultString });
});

/**
 * @openapi
 * /feedback:
 *   post:
 *     summary: Submit user feedback
 *     tags:
 *      - Telemetry
 *     description: Logs user feedback, including Alloy data, layout specification, and errors.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               alloydatum:
 *                 type: string
 *                 description: The Alloy instance in XML format.
 *               cnd:
 *                 type: string
 *                 description: The Cope and Drag specification in YAML format.
 *               feedback:
 *                 type: string
 *                 description: User feedback text.
 *               error:
 *                 type: string
 *                 description: Error details, if any.
 *               instanceNumber:
 *                 type: integer
 *                 description: The temporal instance number.
 *     responses:
 *       200:
 *         description: Acknowledgement message.
 *         content:
 *           application/json:
 *             schema:
 *                   type: string
 */
app.post('/feedback', (req, res) => {
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

// Server setup
const server = http.createServer(app);

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});

const shutdown = () => {
    console.log('Received termination signal, shutting down gracefully...');
    server.close(() => {
        console.log('Closed out remaining connections.');
        process.exit(0);
    });

    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
