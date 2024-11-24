import { BasePlugin } from '@appium/base-plugin';
import { logger } from 'appium/support';
import { createNonStreamingMultipartContent } from './google-vertexai';
import { getCoordinatesByInput } from './google-vision';
import loki from 'lokijs';

const packageJson = require('../package.json');
const log = logger.getLogger('ai-appium-lens');

const path = require('path');
const fs = require('fs');

// Initialize LokiJS
const db = new loki('sessions.db');
const sessions = db.addCollection('sessions');

async function askGoogleVisionAI(instruction: string, encodedImg: string): Promise<any> {
    log.info(`Instruction Received: ${instruction}`);
    let response;
    try {
        const projectId = process.env.GOOGLE_PROJECT_ID;
        const location = process.env.GOOGLE_LOCATION;
        const model = process.env.GOOGLE_MODEL;

        if (!projectId || !location || !model) {
            throw new Error('Google Cloud environment variables are not set');
        }
        response = await createNonStreamingMultipartContent(projectId, location,model, encodedImg, instruction);
        console.log("AI Response:", response);
    } catch (error) {
        console.error("Error processing the image or query:", error);
    }
    return response;
}

const SOURCE_URL_REGEX = new RegExp('/session/[^/]+/plugin/ai-appium-lens');

class AIAppiumLens extends BasePlugin {
    constructor(pluginName: string) {
        super(pluginName);
    }

    shouldAvoidProxy(_method: any, route: string, _body: any): boolean {
        log.info(`Checking if route ${route} should be avoided`);
        return SOURCE_URL_REGEX.test(route);
    }

    static newMethodMap = {
        '/session/:sessionId/plugin/ai-appium-lens/askAI': {
            POST: {
                command: 'askAI',
                payloadParams: { required: ['instruction'] },
            },
        },
        '/session/:sessionId/plugin/ai-appium-lens/aiClick': {
            POST: {
                command: 'aiClick',
                payloadParams: { required: ['text','index', 'firstCallOnThisScreen', 'isScreenRefreshed'] },
            },
        }
    };

    async askAI(next: Function, driver: any, ...args: any[]): Promise<any> {
        const packageName = packageJson.name;
        log.info(`${packageName} : askAI called}`);
        log.info(`Arguments: ${JSON.stringify(args)}`);
        const instruction = args[0];
        const b64Screenshot = await driver.getScreenshot();
        const screenshotsDir = path.join(__dirname, 'screenshots');
        if (!fs.existsSync(screenshotsDir)) {
            fs.mkdirSync(screenshotsDir);
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const screenshotPath = path.join(screenshotsDir, `screenshot-${timestamp}.png`);
        log.info(`Screenshot Path: ${screenshotPath}`);
        await fs.writeFileSync(screenshotPath, b64Screenshot, 'base64');
        const screenshotBuffer = fs.readFileSync(screenshotPath);
        const base64Screenshot = screenshotBuffer.toString('base64');
        return await askGoogleVisionAI(instruction, base64Screenshot);
    }

    async aiClick(next: Function, driver: any, ...args: any[]): Promise<any> {
        const packageName = packageJson.name;
        log.info(`${packageName} : aiClick called}`);
        log.info(`Arguments: ${JSON.stringify(args)}`);
        const text = args[0];
        const index = args[1];
        const firstCalllOnThisScreen = args[2];
        const isScreenRefreshed = args[3];
        const sessionId = driver.sessionId;

        let screenshotPath: string;

        if (firstCalllOnThisScreen || isScreenRefreshed) {
            // Take a new screenshot and update the session data
            log.info(`Making call to AI on new screenshot because flags  firstCalllOnThisScreen:  ${firstCalllOnThisScreen} and isScreenRefreshed: ${isScreenRefreshed}`);
            const b64Screenshot = await driver.getScreenshot();
            const screenshotsDir = path.join(__dirname, 'screenshots');
            if (!fs.existsSync(screenshotsDir)) {
                fs.mkdirSync(screenshotsDir);
            }
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            screenshotPath = path.join(screenshotsDir, `screenshot-${timestamp}.png`);
            log.info(`Screenshot Path: ${screenshotPath}`);
            await fs.writeFileSync(screenshotPath, b64Screenshot, 'base64');

            // Update session data
            let sessionData = sessions.findOne({ sessionId });
            if (sessionData) {
                sessionData.imageUrl = screenshotPath;
                sessions.update(sessionData);
            } else {
                sessions.insert({ sessionId, imageUrl: screenshotPath });
            }
        } else {
            // Use the existing screenshot URL
            log.info(`Using cache because flags firstCalllOnThisScreen:  ${firstCalllOnThisScreen} and isScreenRefreshed: ${isScreenRefreshed}`);
            const sessionData = sessions.findOne({ sessionId });
            if (sessionData) {
                screenshotPath = sessionData.imageUrl;
            } else {
                throw new Error('No existing screenshot found for this session');
            }
        }

        // Perform the AI click operation using the imageUrl and text
        return await getCoordinatesByInput(text, screenshotPath,firstCalllOnThisScreen,isScreenRefreshed,sessionId,index);
    }
}

export default AIAppiumLens;