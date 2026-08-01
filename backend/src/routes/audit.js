"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const router = (0, express_1.Router)();
const requirePin = (req, res, next) => {
    const masterPin = process.env.MASTER_PIN;
    if (!masterPin || req.query.pin !== masterPin) {
        return res.status(401).json({ error: 'Unauthorized: Invalid PIN or PIN not configured' });
    }
    next();
};
router.get('/', requirePin, async (req, res) => {
    try {
        const logs = await AuditLog_1.default.find().sort({ timestamp: -1 });
        res.json(logs);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get('/export/pdf', requirePin, async (req, res) => {
    try {
        const logs = await AuditLog_1.default.find().sort({ timestamp: -1 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="Audit_Log.pdf"');
        const doc = new pdfkit_1.default({ margin: 50 });
        doc.pipe(res);
        doc.fontSize(20).text('Sistem Manajemen Kosan Fio', { align: 'center' });
        doc.fontSize(14).text('Laporan Audit & Aktivitas Sistem', { align: 'center' });
        doc.moveDown(2);
        logs.forEach(log => {
            doc.fontSize(10).font('Helvetica-Bold').text(`[${new Date(log.timestamp).toLocaleString('id-ID')}] ${log.action} ${log.entity}`);
            doc.font('Helvetica').text(log.details);
            doc.moveDown(0.5);
        });
        doc.end();
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=audit.js.map