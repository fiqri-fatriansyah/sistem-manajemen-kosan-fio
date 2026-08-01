"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDemoState = exports.getDemoState = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const demoStatePath = path_1.default.join(__dirname, '../../demo_state.json');
const getDemoState = () => {
    if (!fs_1.default.existsSync(demoStatePath)) {
        return false;
    }
    try {
        const data = fs_1.default.readFileSync(demoStatePath, 'utf8');
        const parsed = JSON.parse(data);
        return parsed.isDemoMode === true;
    }
    catch (e) {
        return false;
    }
};
exports.getDemoState = getDemoState;
const setDemoState = (isDemoMode) => {
    fs_1.default.writeFileSync(demoStatePath, JSON.stringify({ isDemoMode }), 'utf8');
};
exports.setDemoState = setDemoState;
//# sourceMappingURL=demoState.js.map