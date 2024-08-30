// src/index.ts
import * as http from 'http';
import { AlloyAtom, AlloyDatum, AlloyInstance, AlloyType, parseAlloyXML } from './alloy-instance';

import { LayoutInstance } from './layout/layoutinstance';

import { WebColaLayout } from './webcola-gen/graphtowebcola';
import { ConstraintValidator } from './webcola-gen/constraint-validator';
import { InstanceLayout } from './layout/interfaces';

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

function getLayout(req: any) : InstanceLayout { 
    let {instances, li, instanceNumber} = getFormContents(req);
    return li.generateLayout(instances[instanceNumber]);
}


app.post('/webcolafiles', (req, res) => {    

    let layout = getLayout(req);
    let cl = new WebColaLayout(layout);

    let layoutNodes = layout.nodes;
    let layoutEdges = layout.edges;
    let layoutConstraints = layout.constraints;
    let layoutGroups = layout.groups;


    let colaConstraints = cl.colaConstraints;
    let colaNodes = cl.colaNodes;
    let colaEdges = cl.colaEdges;
    let colaGroups = cl.groupDefinitions;
    


    const constraintValidator = new ConstraintValidator(colaConstraints, colaNodes, colaGroups);
    const error = constraintValidator.validateConstraints();
    if (error) {
        console.error("Error validating constraints:", error);
        // This is "I am a teapot" error code, which is a joke error code.
        res.status(418).send(error);
        return;
    }

    res.render('webcolavis', { 
        'height': cl.FIG_HEIGHT,
        'width': cl.FIG_WIDTH,
        'colaNodes': colaNodes,
        'colaEdges': colaEdges,
        'colaConstraints' : colaConstraints, 
        'colaGroups': colaGroups,
        layoutNodes,
        layoutEdges,
        layoutConstraints
    
    });
});





const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});