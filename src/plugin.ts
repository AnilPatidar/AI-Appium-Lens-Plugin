import { BasePlugin } from '@appium/base-plugin'
import { logger } from 'appium/support';
const packageJson = require('../package.json');
const log = logger.getLogger('ai-appium-lens');

  
 

async function askGoogleVisionAI(instruction: string): Promise<any>  {
    log.info(`Instruction: ${instruction}`);
    return true;
}

const SOURCE_URL_REGEX = new RegExp('/session/[^/]+/plugin/ai-appium-lens/.*');
// Example usage
class AIAppiumLens extends BasePlugin {
   
    constructor(pluginName: string) {
        super(pluginName);
    }

    shouldAvoidProxy(_method: any, route: string, _body: any): boolean {

        return SOURCE_URL_REGEX.test(route);
    }

    static newMethodMap = {
        '/session/:sessionId/plugin/ai-appium-lens/ask': {
           GET:{  command: 'askAI',
            payloadParams: {required: ['instruction']},
            },
        },
        '/session/:sessionId/plugin/ai-appium-lens/aiClick': {
           GET:{  command: 'aiClick',
            payloadParams: {required: ['instruction']},
            },
        }
    };

    async askAI(next: Function, driver: any, ...args: any[]): Promise<any> {
        const packageName = packageJson.name;
        log.info(`${packageName} : askAI called}`);
        log.info(`Arguments: ${JSON.stringify(args)}`);
        const instruction = args[0];
         await askGoogleVisionAI(instruction);
    }


 
   
}

export default AIAppiumLens;