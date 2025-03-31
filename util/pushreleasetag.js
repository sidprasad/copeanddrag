const { execSync } = require('child_process');
const fs = require('fs');

try {
    // Step 1: Read version from package.json
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const version = packageJson.version;

    if (!version) {
        throw new Error('Version not found in package.json');
    }

    // Step 2: Append 'v' to the version
    const tag = `v${version}`;

    // Step 3: Check if the tag already exists
    const existingTags = execSync('git tag', { encoding: 'utf8' }).split('\n');
    if (existingTags.includes(tag)) {
        throw new Error(`Tag "${tag}" already exists.`);
    }

    // Step 4: Create and push the tag
    execSync(`git tag ${tag}`);
    execSync(`git push origin ${tag}`);
    console.log(`Tag "${tag}" created and pushed successfully.`);
} catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
}