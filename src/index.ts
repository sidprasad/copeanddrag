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

// function getLayout(req: any): InstanceLayout {
//     let { instances, li, instanceNumber, projections } = getFormContents(req);
//     return li.generateLayout(instances[instanceNumber]);
// }

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
        layoutAnnotation,
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