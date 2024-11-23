import { BasePlugin } from '@appium/base-plugin'
import { logger } from 'appium/support';
import { createNonStreamingMultipartContent } from './google-vertexai';

const packageJson = require('../package.json');
const log = logger.getLogger('ai-appium-lens');

const path = require('path');
const fs = require('fs');
  
 

async function askGoogleVisionAI(instruction: string,encodedImg:string): Promise<any>  {
    log.info(`Instruction Recieved : ${instruction}`);
    try {
        const response =await createNonStreamingMultipartContent('combokart-d8a0e','us-central1','gemini-1.5-flash-001',encodedImg,instruction);
         // const response = await processImageAndQuery(imagePath, query);
          console.log("AI Response:", response);
        } catch (error) {
          console.error("Error processing the image or query:", error);
        } 
    return true;
}

const SOURCE_URL_REGEX = new RegExp('/session/[^/]+/plugin/ai-appium-lens');
// Example usage
class AIAppiumLens extends BasePlugin {
   
    constructor(pluginName: string) {
        super(pluginName);
    }

    shouldAvoidProxy(_method: any, route: string, _body: any): boolean {
        log.info(`Checking if route ${route} should be avoided`);
        return SOURCE_URL_REGEX.test(route);
    }

    static newMethodMap = {
        '/session/:sessionId/plugin/ai-appium-lens': {
           POST:{  command: 'askAI',
            payloadParams: {required: ['instruction']},
            },
        }/* ,
        '/session/:sessionId/plugin/ai-appium-lens/aiClick': {
           GET:{  command: 'aiClick',
            payloadParams: {required: ['instruction']},
            },
        } */
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
        fs.writeFileSync(screenshotPath, b64Screenshot, 'base64');
        const screenshotBuffer = fs.readFileSync(screenshotPath);
        const base64Screenshot = screenshotBuffer.toString('base64');
        await askGoogleVisionAI(instruction,base64Screenshot);

    }
   
}

export default AIAppiumLens;

