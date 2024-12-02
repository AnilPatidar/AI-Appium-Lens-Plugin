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
const { getiOSDeviceMultiplier } = require('./utils/coordinate-finder');
const lokijs_1 = __importDefault(require("lokijs"));
const TAP_DURATION_MS = 250;
const packageJson = require('../package.json');
const log = support_1.logger.getLogger('AI-APPIUM-LENS');
const path = require('path');
const fs = require('fs');
// Initialize LokiJS
const db = new lokijs_1.default('sessions.db');
const sessions = db.addCollection('sessions');
function askGoogleVisionAI(instruction, encodedImg) {
    return __awaiter(this, void 0, void 0, function* () {
        log.info(`Instruction Received`);
        let response;
        try {
            const projectId = process.env.GOOGLE_PROJECT_ID;
            const location = process.env.GOOGLE_LOCATION;
            const model = process.env.GOOGLE_MODEL;
            if (!projectId || !location || !model) {
                throw new Error('Google Cloud environment variables are not set');
            }
            response = yield (0, google_vertexai_1.createNonStreamingMultipartContent)(projectId, location, model, encodedImg, instruction);
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
            const instruction = args[0];
            const base64Screenshot = yield this.takeScreenshot(driver);
            return yield askGoogleVisionAI(instruction, base64Screenshot);
        });
    }
    aiAssert(next, driver, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const instruction = args[0];
            const modifiedInstruction = `${instruction}, and return the response strictly in only true/false, if you don't agree with the statement, return false, else true`;
            const base64Screenshot = yield this.takeScreenshot(driver);
            const response = yield askGoogleVisionAI(modifiedInstruction, base64Screenshot);
            return response.replace(/\n/g, '');
        });
    }
    fetchUIElementsMetadataJsonaiAssert(next, driver, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const modifiedInstruction = `return me a json in the form of what text you see, what color, what position, are aligned correctly, aligned/not aligned, also mention they are above/below which text, be specific, no mistake are allowed, set null if you don't find any data, example: {
            "text": "Home",
            "color": "black",
            "position": "bottom",
            "aligned": "not aligned",
            "above": "Enter mobile number",
            "below": "Upcoming match",
            "icon": "Home icon",
            "icon_color": "red",
            "icon_category": null,
            "UI Element": "Button",
            "UI Type": "tile"
        }`;
            const base64Screenshot = yield this.takeScreenshot(driver);
            const response = yield askGoogleVisionAI(modifiedInstruction, base64Screenshot);
            return response.replace(/```json|```/g, '').trim();
        });
    }
    aiClick(next, driver, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const text = args[0];
            const index = args[1];
            const takeANewScreenShot = args[2];
            const sessionId = driver.sessionId;
            const screenshotPath = yield this.getScreenshotPath(driver, sessionId, takeANewScreenShot);
            const coordinates = yield (0, google_vision_1.getCoordinatesByInput)(text, screenshotPath, takeANewScreenShot, sessionId, index);
            if (!coordinates) {
                throw new Error('Coordinates not found');
            }
            const multiplier = yield this.getDeviceMultiplier(driver);
            let { x, y } = coordinates;
            x = x / multiplier;
            y = y / multiplier;
            const action = this.createClickAction(x, y);
            if (driver.performActions) {
                return yield driver.performActions([action]);
            }
            throw new Error("Driver did not implement the 'performActions' command");
        });
    }
    takeScreenshot(driver) {
        return __awaiter(this, void 0, void 0, function* () {
            const b64Screenshot = yield driver.getScreenshot();
            const screenshotsDir = path.join(__dirname, 'screenshots');
            if (!fs.existsSync(screenshotsDir)) {
                fs.mkdirSync(screenshotsDir);
            }
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const screenshotPath = path.join(screenshotsDir, `screenshot-${timestamp}.png`);
            yield fs.writeFileSync(screenshotPath, b64Screenshot, 'base64');
            const screenshotBuffer = fs.readFileSync(screenshotPath);
            return screenshotBuffer.toString('base64');
        });
    }
    getScreenshotPath(driver, sessionId, takeANewScreenShot) {
        return __awaiter(this, void 0, void 0, function* () {
            if (takeANewScreenShot) {
                const base64Screenshot = yield this.takeScreenshot(driver);
                const screenshotsDir = path.join(__dirname, 'screenshots');
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const screenshotPath = path.join(screenshotsDir, `screenshot-${timestamp}.png`);
                yield fs.writeFileSync(screenshotPath, base64Screenshot, 'base64');
                let sessionData = sessions.findOne({ sessionId });
                if (sessionData) {
                    sessionData.imageUrl = screenshotPath;
                    sessions.update(sessionData);
                }
                else {
                    sessions.insert({ sessionId, imageUrl: screenshotPath });
                }
                return screenshotPath;
            }
            else {
                const sessionData = sessions.findOne({ sessionId });
                if (sessionData) {
                    return sessionData.imageUrl;
                }
                else {
                    throw new Error('No existing screenshot found for this session');
                }
            }
        });
    }
    getDeviceMultiplier(driver) {
        return __awaiter(this, void 0, void 0, function* () {
            if (driver.constructor.name === 'AndroidUiautomator2Driver') {
                return 1;
            }
            else if (driver.constructor.name == 'XCUITestDriver') {
                const { width, height } = yield driver.getWindowSize();
                return yield getiOSDeviceMultiplier(width, height);
            }
            throw new Error('Unsupported driver type');
        });
    }
    createClickAction(x, y) {
        return {
            type: 'pointer',
            id: 'mouse',
            parameters: { pointerType: 'touch' },
            actions: [
                { type: 'pointerMove', x, y, duration: 0 },
                { type: 'pointerDown', button: 0 },
                { type: 'pause', duration: TAP_DURATION_MS },
                { type: 'pointerUp', button: 0 },
            ]
        };
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
            payloadParams: { required: ['text', 'index', 'takeANewScreenShot'] },
        },
    },
    '/session/:sessionId/plugin/ai-appium-lens/aiAssert': {
        POST: {
            command: 'aiAssert',
            payloadParams: { required: ['text'] },
        },
    },
    '/session/:sessionId/plugin/ai-appium-lens/fetchUIElementsMetadataJson': {
        POST: {
            command: 'fetchUIElementsMetadataJsonaiAssert',
        },
    },
};
exports.default = AIAppiumLens;
