"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNonStreamingMultipartContent = createNonStreamingMultipartContent;
const vision = require('@google-cloud/vision');
const { VertexAI } = require('@google-cloud/vertexai');
const path = require('path');
const fs = require('fs');
/**
 * TODO(developer): Update these variables before running the sample.
 */
function createNonStreamingMultipartContent(projectId_1, location_1, model_1, imageBase64_1) {
    return __awaiter(this, arguments, void 0, function* (projectId, location, model, imageBase64, instruction = 'Extract text from an image') {
        // Initialize Vertex with your Cloud project and location
        const vertexAI = new VertexAI({ project: projectId, location: location });
        // Instantiate the model
        const generativeVisionModel = vertexAI.getGenerativeModel({
            model: model,
        });
        const filePart = { inline_data: { data: imageBase64, mimeType: 'image/jpeg' } };
        const textPart1 = {
            text: instruction,
        };
        const request = {
            contents: [{ role: 'user', parts: [filePart, textPart1] }],
        };
        console.log('Prompt Text:');
        const textPart2 = request.contents[0].parts[1];
        if ('text' in textPart2) {
            console.log(textPart1.text);
        }
        console.log('AI Response:');
        // Generate a response
        const response = yield generativeVisionModel.generateContent(request);
        if (response && response.response && response.response.candidates && response.response.candidates[0] && response.response.candidates[0].content && response.response.candidates[0].content.parts && response.response.candidates[0].content.parts[0]) {
            // Select the text from the response
            const fullTextResponse = response.response.candidates[0].content.parts[0].text;
            console.log(fullTextResponse);
            return fullTextResponse;
        }
        else {
            console.error('Invalid response format:', response);
        }
    });
}
testAI();
// testing function
function testAI() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const projectId = process.env.GOOGLE_PROJECT_ID;
            const location = process.env.GOOGLE_LOCATION;
            const model = process.env.GOOGLE_MODEL;
            if (!projectId || !location || !model) {
                throw new Error('Google Cloud environment variables are not set');
            }
            const imagePath = path.join(__dirname, 'screenshot.png');
            const imageFile = fs.readFileSync(imagePath);
            var encoded = Buffer.from(imageFile).toString('base64');
            console.log("imageBase64:", encoded);
            const response = yield createNonStreamingMultipartContent(projectId, location, model, encoded, 'image/jpeg');
            // const response = await processImageAndQuery(imagePath, query);
            console.log("AI Response:", response);
        }
        catch (error) {
            console.error("Error processing the image or query:", error);
        }
    });
}
