// src/index.ts
import * as http from 'http';
import { AlloyDatum, AlloyInstance, parseAlloyXML } from './alloy-instance';
import { PenroseInstance } from './penroseinstance';
import { LayoutInstance } from './layoutinstance';
import multer from 'multer';


const express = require('express');
const path = require('path');


const app = express();
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set('view engine', 'ejs');

app.post('/penrosefiles', (req, res) => {    
    const alloyDatum = req.body.alloydatum;
    const layoutAnnotation = req.body.layoutannotation;

    let ad : AlloyDatum = parseAlloyXML(alloyDatum);
    let instances = ad.instances;


    /// TODO: Generate for each instance ///
    /// Right now, we are only generating for the first instance ///
    let instance = instances[0];

    let li = new LayoutInstance(layoutAnnotation);
    let pt = new PenroseInstance(instance, li);

    let s = pt.getSubstance();
    let d = pt.getDomain();
    let sty = pt.getStyle();
    res.render('penrosevjs', { 'substance': s, 'domain': d, 'style': sty });

});


const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});