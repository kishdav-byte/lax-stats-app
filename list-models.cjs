const https = require('https');

const API_KEY = "AIzaSyDLNRZUc89CIGsFtzsdUk1m3J8BVDXVYYM";

function listModels(version) {
    return new Promise((resolve) => {
        console.log(`Listing models for ${version}...`);
        https.get(`https://generativelanguage.googleapis.com/${version}/models?key=${API_KEY}`, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.models) {
                        console.log(`Available models in ${version}:`);
                        json.models.forEach(m => console.log(`  - ${m.name}`));
                    } else {
                        console.log(`No models found in ${version} or error:`, JSON.stringify(json));
                    }
                } catch (e) {
                    console.log(`Error parsing ${version} data: ${e.message}`);
                }
                resolve();
            });
        }).on('error', (err) => {
            console.log(`Error with ${version}: ${err.message}`);
            resolve();
        });
    });
}

async function run() {
    await listModels('v1');
    await listModels('v1beta');
}
run();
