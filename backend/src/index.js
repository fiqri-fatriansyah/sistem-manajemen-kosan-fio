"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = exports.demoMongoURI = exports.baseMongoURI = void 0;
const express_1 = __importStar(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const path_1 = __importDefault(require("path"));
const room_1 = __importDefault(require("./routes/room"));
const customer_1 = __importDefault(require("./routes/customer"));
const rentals_1 = __importDefault(require("./routes/rentals"));
const event_1 = __importDefault(require("./routes/event"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const reports_1 = __importDefault(require("./routes/reports"));
const receipts_1 = __importDefault(require("./routes/receipts"));
const config_1 = __importDefault(require("./routes/config"));
const audit_1 = __importDefault(require("./routes/audit"));
const cron_1 = require("./cron");
// Static files for uploads
const uploadPath = path_1.default.join(__dirname, '../public/uploads');
console.log('UPLOADS_PATH resolving to:', uploadPath);
app.use('/uploads', express_1.default.static(uploadPath));
app.use('/api/rooms', room_1.default);
app.use('/api/customers', customer_1.default);
app.use('/api/rentals', rentals_1.default);
app.use('/api/events', event_1.default);
app.use('/api/dashboard', dashboard_1.default);
app.use('/api/reports', reports_1.default);
app.use('/api/receipts', receipts_1.default);
app.use('/api/config', config_1.default);
app.use('/api/audit', audit_1.default);
(0, cron_1.startCronJobs)();
// Database Connection
const demoState_1 = require("./utils/demoState");
exports.baseMongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/room-Fio';
exports.demoMongoURI = 'mongodb://localhost:27017/inventaris-room-demo';
const connectDB = async () => {
    const isDemo = (0, demoState_1.getDemoState)();
    const uri = isDemo ? exports.demoMongoURI : exports.baseMongoURI;
    if (mongoose_1.default.connection.readyState !== 0) {
        await mongoose_1.default.disconnect();
    }
    await mongoose_1.default.connect(uri);
    console.log(`Connected to MongoDB (${isDemo ? 'DEMO MODE' : 'REAL'})`);
};
exports.connectDB = connectDB;
(0, exports.connectDB)().catch((err) => console.error('Failed to connect to MongoDB:', err));
// Basic Route
app.get('/', (req, res) => {
    res.send('Kosan Fio API is running');
});
app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
//# sourceMappingURL=index.js.map