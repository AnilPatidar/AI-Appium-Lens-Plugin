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
const base_plugin_1 = require("@appium/base-plugin");
const support_1 = require("appium/support");
const google_vertexai_1 = require("./google-vertexai");
const packageJson = require('../package.json');
const log = support_1.logger.getLogger('ai-appium-lens');
const path = require('path');
const fs = require('fs');
function askGoogleVisionAI(instruction, encodedImg) {
    return __awaiter(this, void 0, void 0, function* () {
        log.info(`Instruction Recieved : ${instruction}`);
        try {
            const response = yield (0, google_vertexai_1.createNonStreamingMultipartContent)('combokart-d8a0e', 'us-central1', 'gemini-1.5-flash-001', encodedImg, instruction);
            // const response = await processImageAndQuery(imagePath, query);
            console.log("AI Response:", response);
        }
        catch (error) {
            console.error("Error processing the image or query:", error);
        }
        return true;
    });
}
const SOURCE_URL_REGEX = new RegExp('/session/[^/]+/plugin/ai-appium-lens');
// Example usage
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
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const screenshotPath = path.join(__dirname, `screenshots/screenshot-${timestamp}.png`);
            log.info(`Screenshot Path: ${screenshotPath}`);
            fs.writeFileSync(screenshotPath, b64Screenshot, 'base64');
            const screenshotBuffer = fs.readFileSync(screenshotPath);
            const base64Screenshot = screenshotBuffer.toString('base64');
            yield askGoogleVisionAI(instruction, base64Screenshot);
        });
    }
}
AIAppiumLens.newMethodMap = {
    '/session/:sessionId/plugin/ai-appium-lens': {
        POST: { command: 'askAI',
            payloadParams: { required: ['instruction'] },
        },
    } /* ,
    '/session/:sessionId/plugin/ai-appium-lens/aiClick': {
       GET:{  command: 'aiClick',
        payloadParams: {required: ['instruction']},
        },
    } */
};
exports.default = AIAppiumLens;
