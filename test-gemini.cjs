const { GoogleGenerativeAI } = require("@google/generative-ai");
const API_KEY = "AIzaSyDLNRZUc89CIGsFtzsdUk1m3J8BVDXVYYM";
const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
    try {
        console.log("Listing models...");
        // The SDK doesn't have a direct listModels, but we can try to fetch the models via a direct fetch or search
        // Actually, let's just try the most basic 'gemini-1.5-flash' on 'v1beta' again with a different setup.
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: "v1beta" });
        const result = await model.generateContent("Hello");
        console.log("Success with gemini-1.5-flash on v1beta");
        console.log(result.response.text());
    } catch (e) {
        console.error("Failed:", e.message);
    }
}

listModels();
