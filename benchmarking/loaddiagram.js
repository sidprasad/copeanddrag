import { chromium } from 'playwright';

function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time);
    });
}

async function loadDiagram(copespec, alloydatum, numloads = 1) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const url = 'http://localhost:3000';
    const formData = {
        cope: copespec,
        alloydatum: alloydatum,
        loggingEnabled: "disabled",
        instancenumber: 0
    };

    await page.goto(url);
    await page.fill('#cope', formData.cope);
    await page.fill('#alloydatum', formData.alloydatum);
    await page.selectOption('#loggingEnabled', formData.loggingEnabled);
    await page.fill('#instancenumber', formData.instancenumber.toString());
    await page.click('#controlsForm button[type="submit"]');

    await page.waitForNavigation();

    console.log('Page loaded for the first time. Clicking the button...');

    for (let i = 0; i < numloads; i++) {
        await page.click('#cola');
        await page.waitForNavigation();
        console.log(`Clicked the button ${i + 1} times`);
    }

    await browser.close();
}

async function loadExample(exampleName, numloads = 1) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const url = `http://localhost:3000/example/${exampleName}`;
    await page.goto(url);

    for (let i = 0; i < numloads; i++) {
        // Wait for a delay to ensure the page is ready for interaction
        await delay(3500);

        // Check if the button exists
        const buttonExists = await page.$('#cola') !== null;
        if (!buttonExists) {
            console.error('Button not found');
            break;
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

        console.log(`Loading for the ${i + 1} time`);
    }

    await delay(3000); // Optional delay after the last load
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
await loadExample(exampleName, times).catch(console.error);