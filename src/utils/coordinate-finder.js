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
exports.getiOSDeviceMultiplier = getiOSDeviceMultiplier;
// Function to get the device multiplier based on screen dimensions
function getiOSDeviceMultiplier(width, height) {
    return __awaiter(this, void 0, void 0, function* () {
        // Define device resolutions and their corresponding multipliers
        const devices = [
            { width: 375, height: 667, multiplier: 2, name: 'iPhone 6, 6S, 7, 8, SE (2nd & 3rd Gen)' },
            { width: 360, height: 780, multiplier: 3, name: 'iPhone 12 mini' },
            { width: 375, height: 812, multiplier: 3, name: 'iPhone X, XS, 11 Pro, 12 Mini, 13 Mini' },
            { width: 390, height: 844, multiplier: 3, name: 'iPhone 12, 13, 14' },
            { width: 393, height: 852, multiplier: 3, name: 'iPhone 14 Pro' },
            { width: 414, height: 736, multiplier: 3, name: 'iPhone 6 Plus, 6S Plus, 7 Plus, 8 Plus' },
            { width: 414, height: 896, multiplier: 3, name: 'iPhone XS Max, 11 Pro Max' },
            { width: 414, height: 896, multiplier: 2, name: 'iPhone XR, 11' },
            { width: 428, height: 926, multiplier: 3, name: 'iPhone 12 Pro Max, 13 Pro Max, 14 Plus' },
            { width: 430, height: 932, multiplier: 3, name: 'iPhone 14 Pro Max' }
        ];
        // Check if the device matches any known resolution and return the multiplier
        for (let device of devices) {
            if ((device.width === width && device.height === height)) {
                return device.multiplier;
            }
        }
        // Return '3' if no match is found becuase most modern devices have a 3x multiplier
        return 3;
    });
}
// Example usage
