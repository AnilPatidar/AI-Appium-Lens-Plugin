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
exports.getCoordinatesByInput = getCoordinatesByInput;
const googleVision = require('@google-cloud/vision');
const loki = require('lokijs');
const db = new loki('coordinates.db');
const coordinatesCollection = db.addCollection('coordinates');
// Main function
function getCoordinatesByInput(input, ssPath, firstCallOnThisScreen, isScreenRefreshed, sessionId) {
    return __awaiter(this, void 0, void 0, function* () {
        const keys = [];
        const values = [];
        try {
            if (firstCallOnThisScreen || isScreenRefreshed) {
                // Take a new screenshot and update the session data
                const client = new googleVision.ImageAnnotatorClient();
                const [result] = yield client.textDetection({
                    image: { source: { filename: ssPath } },
                });
                const detections = result.textAnnotations;
                detections.forEach((text, index) => {
                    console.log(`#index ${index} Description: ${text.description}`);
                    console.log('Bounding Poly:');
                    if (index > 0) {
                        keys.push(text.description.trim().toLowerCase());
                        const vertices = text.boundingPoly.vertices;
                        vertices.forEach((vertex, vertexIndex) => {
                            if (vertexIndex == 1) {
                                console.log(`Vertex ${vertexIndex}: (${vertex.x}, ${vertex.y})`);
                                values.push({ x: vertex.x, y: vertex.y });
                            }
                        });
                    }
                });
                console.log('Keys:', keys);
                console.log('Values:', values);
                coordinatesCollection.insert({ sessionId, keys, values });
                db.saveDatabase();
                console.log(`stored in db ${coordinatesCollection.findOne({ sessionId })} `);
            }
            else {
                const record = coordinatesCollection.findOne({ sessionId });
                if (record) {
                    keys.push(...record.keys);
                    values.push(...record.values);
                }
                else {
                    console.log('No record found for the given session ID');
                    return null;
                }
            }
            const points = getCoordinates(keys, values, input);
            if (points) {
                console.log(`Coordinates: (${points.x}, ${points.y})`);
                return points;
            }
            else {
                console.log('Sequence not found');
                return null;
            }
        }
        catch (error) {
            console.error("Error processing the image or query:", error);
            return null;
        }
    });
}
function getCoordinates(keys, values, input) {
    const inputKeys = input.split(' ').map((key) => key.toLowerCase());
    for (let i = 0; i <= keys.length - inputKeys.length; i++) {
        let match = true;
        for (let j = 0; j < inputKeys.length; j++) {
            if (keys[i + j] !== inputKeys[j]) {
                match = false;
                break;
            }
        }
        if (match) {
            return values[i];
        }
    }
    return null;
}
//testAI();
function testAI() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield getCoordinatesByInput('continue', '/Users/anil-patidar/Desktop/AppiumLensAI/src/screenshots/screenshot-2024-11-24T17-57-08-339Z.png', true, true, 'session1');
            console.log("AI Response:", response);
        }
        catch (error) {
            console.error("Error processing the image or query:", error);
        }
    });
}
