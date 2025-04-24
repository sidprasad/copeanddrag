const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');

// Get the log file path and mode from command-line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
    console.error("Usage: node computestats.js <logfile> <-all|-aggregated>");
    process.exit(1);
}

const logfile = path.resolve(__dirname, args[0]);

// Check if the file exists
if (!fs.existsSync(logfile)) {
    console.error(`Error: Log file "${logfile}" does not exist.`);
    process.exit(1);
}

// Read the raw file data
const rawData = fs.readFileSync(logfile);

// Decode the file using iconv-lite
let logData;
try {
    logData = iconv.decode(rawData, 'utf8'); // Attempt to decode as UTF-8
} catch (err) {
    console.error(`Error decoding file: ${err.message}`);
    process.exit(1);
}

// Regular expressions to extract numbers
let clientMatches = [...logData.matchAll(/Client time: ([\d.]+) ms/g)].map(match => parseFloat(match[1]));
let serverMatches = [...logData.matchAll(/Server time: ([\d.]+) ms/g)].map(match => parseFloat(match[1]));

// Discard the first "Client time" entry, since this comes from the first load.
if (clientMatches.length > 0) {
    clientMatches = clientMatches.slice(1); // Remove the first entry
}

// Ensure serverMatches aligns with clientMatches
const totalTimes = clientMatches.map((val, idx) => val + (serverMatches[idx] || 0));

// Compute statistics
function computeStats(times) {
    if (!times.length) return { count: 0, average: null, stdDev: null };

    const count = times.length;
    const average = times.reduce((a, b) => a + b, 0) / count;
    const variance = times.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / (count - 1 || 1);
    const stdDev = Math.sqrt(variance);

    return { count, average, stdDev };
}

// Helper function to safely format numbers or return a fallback value
function safeToFixed(value, decimals = 2, fallback = "N/A") {
    return value !== null ? value.toFixed(decimals) : fallback;
}

// Calculate stats
const clientStats = computeStats(clientMatches);
const serverStats = computeStats(serverMatches);
const totalStats = computeStats(totalTimes);

// Print file name without the .txt extension and count
const fileNameWithoutExt = path.parse(logfile).name; // Extract the file name without extension
console.log(``);

// Prepare the table data
const tableData = clientMatches.map((clientTime, idx) => ({
    Index: idx + 1,
    "Constraint Solving Time": serverMatches[idx] || 0,
    "Graph Layout Time": clientTime,
    "Total Time": totalTimes[idx]
}));

// Add standard deviation row
tableData.unshift({
    Index: "Std Dev",
    "Constraint Solving Time": safeToFixed(serverStats.stdDev),
    "Graph Layout Time": safeToFixed(clientStats.stdDev),
    "Total Time": safeToFixed(totalStats.stdDev)
});

// Add average row
tableData.unshift({
    Index: "Average",
    "Constraint Solving Time": safeToFixed(serverStats.average),
    "Graph Layout Time": safeToFixed(clientStats.average),
    "Total Time": safeToFixed(totalStats.average)
});

console.log(`\n Ran example ${fileNameWithoutExt} , ${clientStats.count} time(s).\n`);
console.table(tableData);

