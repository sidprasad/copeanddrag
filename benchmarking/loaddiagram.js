const { chromium } = require('playwright');

function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time);
    });
}

async function loadExample(exampleName, numloads = 1) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const url = `http://localhost:3000/example/${exampleName}`;
    await page.goto(url);


    for (let i = 0; i < numloads; i++) {

        await delay(4000); // Wait for 4 seconds before clicking the button


        console.log(`Loading for the ${i + 1} time`);
        //const buttonExists = await page.$('#cola') !== null;
        // Wait for the #cola button to load
        try {
            await page.waitForSelector('#cola', { timeout: 5000 }); // Adjust the timeout as needed
        } catch (err) {
            console.error('The page did not load within the timeout. Something may be wrong with the browser.', err);
            continue;
        }

        // Click the button and wait for the page to reload
        await Promise.all([
            page.click('#cola'), // Click the button
            page.waitForNavigation({ waitUntil: 'domcontentloaded' }) // Wait for the page to reload
        ]);

        // Wait for a specific element that indicates D3 has fully loaded
        try {
            await page.waitForSelector('svg', { timeout: 5000 }); // Adjust the selector to match your D3 element
            //console.log(`D3 content loaded for the ${i + 1} time`);
        } catch (err) {
            console.error(`D3 content did not load within the timeout for the ${i + 1} time`);
        }

    }

    await browser.close();
}

// Parse command-line arguments
const args = process.argv.slice(2);
const exampleName = args[0]; // First argument: example name
const times = parseInt(args[1], 10) || 1; // Second argument: number of times (default to 1)

// Validate arguments
if (!exampleName) {
    console.error("Error: Example name is required.");
    process.exit(1);
}

// Run loadExample with the provided arguments
loadExample(exampleName, times).catch(console.error);