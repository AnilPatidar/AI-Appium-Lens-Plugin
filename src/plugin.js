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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_plugin_1 = require("@appium/base-plugin");
const support_1 = require("appium/support");
const google_vertexai_1 = require("./google-vertexai");
const google_vision_1 = require("./google-vision");
const lokijs_1 = __importDefault(require("lokijs"));
const packageJson = require('../package.json');
const log = support_1.logger.getLogger('ai-appium-lens');
const path = require('path');
const fs = require('fs');
// Initialize LokiJS
const db = new lokijs_1.default('sessions.db');
const sessions = db.addCollection('sessions');
function askGoogleVisionAI(instruction, encodedImg) {
    return __awaiter(this, void 0, void 0, function* () {
        log.info(`Instruction Received: ${instruction}`);
        let response;
        try {
            response = yield (0, google_vertexai_1.createNonStreamingMultipartContent)('combokart-d8a0e', 'us-central1', 'gemini-1.5-flash-001', encodedImg, instruction);
            console.log("AI Response:", response);
        }
        catch (error) {
            console.error("Error processing the image or query:", error);
        }
        return response;
    });
}
const SOURCE_URL_REGEX = new RegExp('/session/[^/]+/plugin/ai-appium-lens');
class AIAppiumLens extends base_plugin_1.BasePlugin {
    constructor(pluginName) {
        super(pluginName);
    }
    shouldAvoidProxy(_method, route, _body) {
        log.info(`Checking if route ${route} should be avoided`);
        return SOURCE_URL_REGEX.test(route);
    }
    askAI(next, driver, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const packageName = packageJson.name;
            log.info(`${packageName} : askAI called}`);
            log.info(`Arguments: ${JSON.stringify(args)}`);
            const instruction = args[0];
            const b64Screenshot = yield driver.getScreenshot();
            const screenshotsDir = path.join(__dirname, 'screenshots');
            if (!fs.existsSync(screenshotsDir)) {
                fs.mkdirSync(screenshotsDir);
            }
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const screenshotPath = path.join(screenshotsDir, `screenshot-${timestamp}.png`);
            log.info(`Screenshot Path: ${screenshotPath}`);
            yield fs.writeFileSync(screenshotPath, b64Screenshot, 'base64');
            const screenshotBuffer = fs.readFileSync(screenshotPath);
            const base64Screenshot = screenshotBuffer.toString('base64');
            return yield askGoogleVisionAI(instruction, base64Screenshot);
        });
    }
    aiClick(next, driver, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const packageName = packageJson.name;
            log.info(`${packageName} : aiClick called}`);
            log.info(`Arguments: ${JSON.stringify(args)}`);
            const text = args[0];
            const firstCalllOnThisScreen = args[1];
            const isScreenRefreshed = args[2];
            const sessionId = driver.sessionId;
            let screenshotPath;
            if (firstCalllOnThisScreen || isScreenRefreshed) {
                // Take a new screenshot and update the session data
                log.info(`Making call to AI on new screenshot because flags  firstCalllOnThisScreen:  ${firstCalllOnThisScreen} and isScreenRefreshed: ${isScreenRefreshed}`);
                const b64Screenshot = yield driver.getScreenshot();
                const screenshotsDir = path.join(__dirname, 'screenshots');
                if (!fs.existsSync(screenshotsDir)) {
                    fs.mkdirSync(screenshotsDir);
                }
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                screenshotPath = path.join(screenshotsDir, `screenshot-${timestamp}.png`);
                log.info(`Screenshot Path: ${screenshotPath}`);
                yield fs.writeFileSync(screenshotPath, b64Screenshot, 'base64');
                // Update session data
                let sessionData = sessions.findOne({ sessionId });
                if (sessionData) {
                    sessionData.imageUrl = screenshotPath;
                    sessions.update(sessionData);
                }
                else {
                    sessions.insert({ sessionId, imageUrl: screenshotPath });
                }
            }
            else {
                // Use the existing screenshot URL
                log.info(`Using cache because flags firstCalllOnThisScreen:  ${firstCalllOnThisScreen} and isScreenRefreshed: ${isScreenRefreshed}`);
                const sessionData = sessions.findOne({ sessionId });
                if (sessionData) {
                    screenshotPath = sessionData.imageUrl;
                }
                else {
                    throw new Error('No existing screenshot found for this session');
                }
            }
            // Perform the AI click operation using the imageUrl and text
            return yield (0, google_vision_1.getCoordinatesByInput)(text, screenshotPath, firstCalllOnThisScreen, isScreenRefreshed, sessionId);
        });
    }
}
AIAppiumLens.newMethodMap = {
    '/session/:sessionId/plugin/ai-appium-lens/askAI': {
        POST: {
            command: 'askAI',
            payloadParams: { required: ['instruction'] },
        },
    },
    '/session/:sessionId/plugin/ai-appium-lens/aiClick': {
        POST: {
            command: 'aiClick',
            payloadParams: { required: ['text', 'firstCallOnThisScreen', 'isScreenRefreshed'] },
        },
    }
};
exports.default = AIAppiumLens;
