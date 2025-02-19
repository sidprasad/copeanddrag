//const puppeteer = require('puppeteer');

import puppeteer from 'puppeteer';

function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time);
    });
}

async function loadDiagram(copespec, alloydatum, numloads = 1) {
    const browser = await puppeteer.launch({ headless: false }); // Set headless: true to run in headless mode
    const page = await browser.newPage();

    // Define the URL and form data
    const url = 'http://localhost:3000'; // Replace with your actual URL
    const formData = {
        cope: copespec, // Replace with your actual cope data
        alloydatum: alloydatum, // Replace with your actual alloy data
        loggingEnabled: "disabled",
        instancenumber: 0 // Replace with your actual instance number
    };

    // Load the page and submit the form
    await page.goto(url);
    await page.evaluate((formData) => {
        document.getElementById('cope').value = formData.cope;
        document.getElementById('alloydatum').value = formData.alloydatum;
        document.getElementById('loggingEnabled').value = formData.loggingEnabled;
        document.getElementById('instancenumber').value = formData.instancenumber;
        document.getElementById('controlsForm').submit();
    }, formData);

    // Wait for navigation to complete
    await page.waitForNavigation();

    console.log('Page loaded for the first time. Clicking the button...');

    for (let i = 0; i < numloads; i++) {
        // Click the button
        await page.click('#cola');

        // Wait for navigation to complete
        await page.waitForNavigation();

        console.log(`Clicked the button ${i + 1} times`);
    }

    await browser.close();
}


async function loadExample(exampleName, numloads = 1) {

    const browser = await puppeteer.launch({ headless: true }); // Set headless: true to run in headless mode
    const page = await browser.newPage();

    // Define the URL and form data
    const url = `http://localhost:3000/example/${exampleName}`; 
    await page.goto(url);


    // Wait for navigation to complete
    //await page.waitForNavigation();

    for (let i = 0; i < numloads; i++) {

        await delay(1000);

        const buttonExists = await page.$('#cola') !== null;
        
        if (!buttonExists) {
            console.error('Button not found');
            break;
        }

        await Promise.all([
            page.waitForNavigation(),
            // What if the button is not there?
            page.click('#cola')
        ]);
        console.log(`Clicked the button ${i + 1} times`);

    }
    await delay(3000);
    await browser.close();
}



const TIMES = 50;
const copespec = `constraints:
    - orientation: {sigs : [B, A], directions: [left]}`;
const alloydatum = `<alloy builddate="Wednesday, November 13th, 2024">
<instance bitwidth="4" maxseq="-1" command="temporary-name_source_1" filename="/no-name.rkt" version="3.5"  >

<sig label="seq/Int" ID="0" parentID="1" builtin="yes">
</sig>

<sig label="Int" ID="1" parentID="2" builtin="yes">
</sig>

<sig label="univ" ID="2" builtin="yes">
</sig>

<field label="no-field-guard" ID="3" parentID="2">
<types> <type ID="2"/><type ID="2"/> </types>
</field>

<sig label="A" ID="4" parentID="2">
<atom label="A"/>
</sig>

<sig label="B" ID="5" parentID="2">
<atom label="B"/>
</sig>


</instance>

<source filename="/no-name.rkt" content="// Couldn't open source file (/no-name.rkt) (info: (2 . posix)). Is the file saved?"></source>
</alloy>`;
//loadDiagram(copespec, alloydatum, TIMES).catch(console.error);
await loadExample("chord", TIMES).catch(console.error);