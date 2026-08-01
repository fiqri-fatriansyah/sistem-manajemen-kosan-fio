"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Config_1 = __importDefault(require("../models/Config"));
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
const index_1 = require("../index");
const demoState_1 = require("../utils/demoState");
const demoSeeder_1 = require("../utils/demoSeeder");
const mongoose_1 = __importDefault(require("mongoose"));
const Customer_1 = __importDefault(require("../models/Customer"));
const Room_1 = __importDefault(require("../models/Room"));
const RentalTransaction_1 = __importDefault(require("../models/RentalTransaction"));
const Event_1 = __importDefault(require("../models/Event"));
const cron_1 = require("../cron");
const whatsapp_1 = require("../whatsapp");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    let config = await Config_1.default.findOne();
    if (!config) {
        config = new Config_1.default();
        await config.save();
    }
    res.json(config);
});
router.post('/', async (req, res) => {
    try {
        const { penaltyType, penaltyCost, enableWhatsAppBot, waLinkType, waKwitansiType } = req.body;
        let config = await Config_1.default.findOne();
        if (!config) {
            config = new Config_1.default();
        }
        // Check if toggle changed
        if (enableWhatsAppBot && !config.enableWhatsAppBot) {
            (0, whatsapp_1.initWhatsApp)();
        }
        else if (!enableWhatsAppBot && config.enableWhatsAppBot) {
            await (0, whatsapp_1.destroyWhatsApp)();
        }
        config.penaltyType = penaltyType;
        config.penaltyCost = penaltyCost;
        config.enableWhatsAppBot = enableWhatsAppBot;
        if (waLinkType)
            config.waLinkType = waLinkType;
        if (waKwitansiType)
            config.waKwitansiType = waKwitansiType;
        await config.save();
        await AuditLog_1.default.create({
            action: 'UPDATE',
            entity: 'Config',
            details: `Global penalties updated to ${config.penaltyType} (Rp ${config.penaltyCost})`
        });
        res.json(config);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// GET WhatsApp Status
router.get('/whatsapp-status', async (req, res) => {
    res.json((0, whatsapp_1.getWhatsAppStatus)());
});
router.post('/wipe', async (req, res) => {
    try {
        const { pin, wipeAudit } = req.body;
        const resetPin = process.env.RESET_PIN;
        if (!pin || pin !== resetPin) {
            return res.status(401).json({ error: 'Master PIN salah atau belum dikonfigurasi' });
        }
        if ((0, demoState_1.getDemoState)()) {
            return res.status(403).json({ error: 'Factory Reset tidak dapat dilakukan saat Mode Contoh (Demo) sedang aktif. Matikan Mode Contoh terlebih dahulu.' });
        }
        await mongoose_1.default.connection.collection('rooms').deleteMany({});
        await mongoose_1.default.connection.collection('customers').deleteMany({});
        await mongoose_1.default.connection.collection('rentaltransactions').deleteMany({});
        if (wipeAudit) {
            await mongoose_1.default.connection.collection('auditlogs').deleteMany({});
        }
        else {
            await AuditLog_1.default.create({
                action: 'DELETE',
                entity: 'System',
                details: 'Factory Reset dilakukan (Semua data dihapus kecuali Audit)'
            });
        }
        res.json({ message: 'Semua data telah dihapus.' });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get('/demo-status', (req, res) => {
    res.json({ isDemoMode: (0, demoState_1.getDemoState)() });
});
router.post('/toggle-demo', async (req, res) => {
    try {
        const { pin } = req.body;
        const resetPin = process.env.RESET_PIN;
        if (!resetPin || pin !== resetPin) {
            return res.status(401).json({ error: 'Reset PIN salah atau belum dikonfigurasi' });
        }
        const currentIsDemo = (0, demoState_1.getDemoState)();
        const newIsDemo = !currentIsDemo;
        if (!newIsDemo) {
            // Currently in DEMO. Drop the demo DB entirely to clean up space before switching to real
            await mongoose_1.default.connection.db?.dropDatabase();
        }
        (0, demoState_1.setDemoState)(newIsDemo);
        await (0, index_1.connectDB)();
        if (newIsDemo) {
            // Switched to DEMO. Generate the advanced mock data.
            await (0, demoSeeder_1.generateAdvancedSeed)();
        }
        res.json({ success: true, isDemoMode: newIsDemo });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=config.js.map