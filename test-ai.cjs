const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = "AIzaSyDLNRZUc89CIGsFtzsdUk1m3J8BVDXVYYM";
const genAI = new GoogleGenerativeAI(API_KEY);

async function testModel(modelName, version) {
    console.log(`Testing ${modelName} on ${version}...`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: version });
        const result = await model.generateContent("Say 'hello'");
        const response = await result.response;
        console.log(`  Success! Response: ${response.text().trim()}`);
        return true;
    } catch (e) {
        console.log(`  Failed: ${e.message}`);
        return false;
    }
}

async function runTests() {
    const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
    const versions = ["v1", "v1beta"];

    for (const m of models) {
        for (const v of versions) {
            await testModel(m, v);
        }
    }
}

runTests();
