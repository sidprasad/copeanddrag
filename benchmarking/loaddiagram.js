import { chromium } from 'playwright';

function delay(time) {
    return new Promise(function(resolve) { 
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

        await delay(1000);

        const buttonExists = await page.$('#cola') !== null;
        
        if (!buttonExists) {
            console.error('Button not found');
            break;
        }

        await Promise.all([
            page.waitForNavigation(),
            page.click('#cola')
        ]);
        console.log(`Clicked the button ${i + 1} times`);

    }
    await delay(3000);
    await browser.close();
}

const TIMES = 50;

await loadExample("chord", TIMES).catch(console.error);